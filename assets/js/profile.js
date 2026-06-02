"use strict";

/*
  profile.js - Logic for pages/user/perfil_user.html
  Loads the authenticated user's profile, renders the admin-style profile UI,
  saves editable fields, changes password and handles logout actions.
*/

const UserProfile = (() => {
  let currentAuthUser = null;
  let lastSavedProfile = null;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const els = getProfileElements();
    if (!els.form || !window.supabaseClient) return;

    bindStaticActions(els);
    setLoadingState(els, true);

    try {
      const session = await getActiveSession();
      if (!session) {
        redirectToLogin();
        return;
      }

      currentAuthUser = session.user;

      const role = await getRoleSafely();
      // Solo redirigir si el admin intenta entrar a la página de perfil de usuario común (perfil_user.html)
      if (role === "admin_cancha" && window.location.pathname.includes("/user/perfil_user.html")) {
        window.location.href = "../admin/admin-dashboard.html";
        return;
      }

      lastSavedProfile = await loadProfile(currentAuthUser);
      renderProfile(els, lastSavedProfile, currentAuthUser);
      bindProfileForm(els);
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
      showToast("No se pudo cargar tu perfil. Intenta nuevamente.");
    } finally {
      setLoadingState(els, false);
    }
  }

  function getProfileElements() {
    return {
      form: document.getElementById("profile-form"),
      name: document.getElementById("profile-name"),
      lastname: document.getElementById("profile-lastname"),
      email: document.getElementById("profile-email"),
      phone: document.getElementById("profile-phone"),
      saveButton: document.getElementById("btn-save"),
      cancelButton: document.getElementById("btn-cancel"),
      editToggle: document.getElementById("prf-edit-toggle"),
      viewMode: document.getElementById("prf-view-mode"),
      editMode: document.getElementById("prf-edit-mode"),
      heroName: document.getElementById("prf-hero-name"),
      heroEmail: document.getElementById("prf-hero-email"),
      heroSince: document.getElementById("prf-hero-since"),
      heroAvatar: document.getElementById("prf-avatar-img"),
      viewName: document.getElementById("prf-view-name"),
      viewEmail: document.getElementById("prf-view-email"),
      viewPhone: document.getElementById("prf-view-phone"),
      sidebarName: document.getElementById("sidebar-user-name"),
      sidebarEmail: document.getElementById("sidebar-user-email"),
      sidebarAvatar: document.getElementById("sidebar-avatar-img"),
      passwordModal: document.getElementById("prf-password-modal"),
      passwordOpen: document.getElementById("prf-open-password"),
      passwordCancel: document.getElementById("prf-cancel-password"),
      passwordSave: document.getElementById("prf-save-password"),
      passwordNew: document.getElementById("prf-new-password"),
      passwordConfirm: document.getElementById("prf-confirm-password"),
      passwordError: document.getElementById("prf-password-error"),
      signOutAll: document.getElementById("prf-signout-all"),
      logoutButton: document.getElementById("btn-logout"),
    };
  }

  function bindStaticActions(els) {
    els.editToggle?.addEventListener("click", toggleProfileEdit);
    els.passwordOpen?.addEventListener("click", openChangePassword);
    els.passwordCancel?.addEventListener("click", closeChangePassword);
    els.passwordSave?.addEventListener("click", saveNewPassword);
    els.signOutAll?.addEventListener("click", signOutAll);
    els.logoutButton?.addEventListener("click", logout);

    document.querySelectorAll("[data-coming-soon]").forEach((button) => {
      button.addEventListener("click", () => showToast("Función disponible próximamente."));
    });

    els.passwordModal?.addEventListener("click", (event) => {
      if (event.target === els.passwordModal) closeChangePassword();
    });
  }

  async function getActiveSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  async function getRoleSafely() {
    if (typeof window.getUserRole !== "function") return "user";

    try {
      return (await window.getUserRole()) || "user";
    } catch (error) {
      console.warn("No se pudo verificar el rol del usuario:", error);
      return "user";
    }
  }

  async function loadProfile(authUser) {
    if (typeof window.getUserProfile === "function") {
      try {
        return await window.getUserProfile(authUser.id);
      } catch (error) {
        if (error?.code !== "PGRST116") throw error;
      }
    }

    const metadata = authUser.user_metadata || {};
    const fallbackProfile = {
      id: authUser.id,
      nombre: metadata.nombre || metadata.name || emailName(authUser.email),
      apellido: metadata.apellido || "",
      telefono: metadata.telefono || "",
      correo_electronico: authUser.email || "",
      rol: "user",
    };

    if (typeof window.insertUserProfile === "function") {
      await window.insertUserProfile(authUser.id, {
        name: fallbackProfile.nombre,
        lastname: fallbackProfile.apellido,
        phone: fallbackProfile.telefono,
        email: fallbackProfile.correo_electronico,
        rol: fallbackProfile.rol,
      });

      return window.getUserProfile(authUser.id);
    }

    return fallbackProfile;
  }

  function renderProfile(els, profile, authUser) {
    const email = profile.correo_electronico || authUser.email || "";
    const fullName = getFullName(profile) || emailName(email) || "Usuario";
    const avatarUrl = buildAvatarUrl(fullName || email);

    els.name.value = profile.nombre || "";
    els.lastname.value = profile.apellido || "";
    els.email.value = email;
    els.phone.value = profile.telefono || "";

    if (els.heroName) els.heroName.textContent = fullName;
    if (els.heroEmail) els.heroEmail.textContent = email || "-";
    if (els.heroSince) els.heroSince.textContent = getMemberSince(authUser);
    if (els.heroAvatar) {
      els.heroAvatar.src = avatarUrl;
      els.heroAvatar.alt = `Avatar de ${fullName}`;
    }

    if (els.viewName) els.viewName.textContent = fullName || "-";
    if (els.viewEmail) els.viewEmail.textContent = email || "-";
    if (els.viewPhone) els.viewPhone.textContent = profile.telefono || "-";

    if (els.sidebarName) els.sidebarName.textContent = fullName;
    if (els.sidebarEmail) els.sidebarEmail.textContent = email;
    if (els.sidebarAvatar) {
      els.sidebarAvatar.src = avatarUrl;
      els.sidebarAvatar.alt = `Avatar de ${fullName}`;
    }
  }

  function bindProfileForm(els) {
    if (els.form.dataset.bound === "true") return;
    els.form.dataset.bound = "true";

    els.cancelButton?.addEventListener("click", () => {
      if (lastSavedProfile && currentAuthUser) renderProfile(els, lastSavedProfile, currentAuthUser);
      setProfileEditMode(false);
    });

    els.form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const updatedProfile = {
        nombre: els.name.value.trim(),
        apellido: els.lastname.value.trim(),
        telefono: els.phone.value.trim(),
      };

      if (!updatedProfile.nombre || !updatedProfile.apellido) {
        showToast("Nombre y apellido son obligatorios.");
        return;
      }

      try {
        setSavingState(els, true);

        if (typeof window.updateUserProfile !== "function") {
          throw new Error("updateUserProfile no esta disponible.");
        }

        await window.updateUserProfile(currentAuthUser.id, updatedProfile);

        const authUpdate = await supabaseClient.auth.updateUser({
          data: {
            nombre: updatedProfile.nombre,
            apellido: updatedProfile.apellido,
            telefono: updatedProfile.telefono,
          },
        });
        if (authUpdate.error) console.warn("No se pudo actualizar metadata de Auth:", authUpdate.error);

        lastSavedProfile = {
          ...lastSavedProfile,
          ...updatedProfile,
          correo_electronico: els.email.value,
        };

        renderProfile(els, lastSavedProfile, currentAuthUser);
        setProfileEditMode(false);
        showToast("Perfil actualizado correctamente.");
      } catch (error) {
        console.error("Error al guardar el perfil:", error);
        showToast("No se pudieron guardar los cambios.");
      } finally {
        setSavingState(els, false);
      }
    });
  }

  function toggleProfileEdit() {
    const editMode = document.getElementById("prf-edit-mode");
    const isEditing = editMode && editMode.style.display !== "none";
    setProfileEditMode(!isEditing);
  }

  function setProfileEditMode(editing) {
    const view = document.getElementById("prf-view-mode");
    const edit = document.getElementById("prf-edit-mode");
    const btn = document.getElementById("prf-edit-toggle");

    if (view) view.style.display = editing ? "none" : "block";
    if (edit) edit.style.display = editing ? "block" : "none";
    if (btn) {
      btn.innerHTML = editing
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancelar'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar';
    }
  }

  function openChangePassword() {
    const els = getProfileElements();
    if (!els.passwordModal) return;

    els.passwordNew.value = "";
    els.passwordConfirm.value = "";
    els.passwordError.textContent = "";
    els.passwordModal.classList.add("open");
  }

  function closeChangePassword() {
    document.getElementById("prf-password-modal")?.classList.remove("open");
  }

  async function saveNewPassword() {
    const els = getProfileElements();
    const password = els.passwordNew?.value || "";
    const confirmation = els.passwordConfirm?.value || "";

    if (password.length < 8) {
      els.passwordError.textContent = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }

    if (password !== confirmation) {
      els.passwordError.textContent = "Las contraseñas no coinciden.";
      return;
    }

    els.passwordError.textContent = "";
    els.passwordSave.disabled = true;
    els.passwordSave.textContent = "Guardando...";

    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;

      closeChangePassword();
      showToast("Contraseña actualizada correctamente.");
    } catch (error) {
      els.passwordError.textContent = `Error: ${error.message}`;
    } finally {
      els.passwordSave.disabled = false;
      els.passwordSave.textContent = "Guardar";
    }
  }

  async function logout() {
    const logoutButton = document.getElementById("btn-logout");
    if (logoutButton) {
      logoutButton.disabled = true;
      logoutButton.textContent = "Cerrando...";
    }

    try {
      await supabaseClient.auth.signOut();
    } finally {
      redirectToLogin();
    }
  }

  async function signOutAll() {
    if (!confirm("¿Cerrar sesión en todos los dispositivos?")) return;

    await supabaseClient.auth.signOut({ scope: "global" });
    window.location.href = "../../index.html";
  }

  function setLoadingState(els, isLoading) {
    [els.name, els.lastname, els.phone].forEach((input) => {
      if (input) input.disabled = isLoading;
    });

    if (els.saveButton) {
      els.saveButton.disabled = isLoading;
      els.saveButton.textContent = isLoading ? "Cargando..." : "Guardar Cambios";
    }
  }

  function setSavingState(els, isSaving) {
    if (!els.saveButton) return;
    els.saveButton.disabled = isSaving;
    els.saveButton.textContent = isSaving ? "Guardando..." : "Guardar Cambios";
  }

  function getFullName(profile) {
    return `${profile.nombre || ""} ${profile.apellido || ""}`.trim();
  }

  function emailName(email) {
    return email ? email.split("@")[0] : "";
  }

  function buildAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Usuario")}&background=2ecc50&color=fff`;
  }

  function getMemberSince(user) {
    const raw = user?.created_at || user?.user_metadata?.created_at;
    if (!raw) return "Miembro ASY";

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Miembro ASY";

    const label = date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    return `Miembro desde ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  }

  function redirectToLogin() {
    window.location.href = "../login.html";
  }

  function showToast(message) {
    if (window.App && typeof window.App.showToast === "function") {
      window.App.showToast(message);
      return;
    }

    const toast = document.getElementById("toast");
    if (!toast) {
      alert(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("toast--visible");
    setTimeout(() => toast.classList.remove("toast--visible"), 3000);
  }

  return {
    init,
    toggleProfileEdit,
    openChangePassword,
    closeChangePassword,
    saveNewPassword,
    signOutAll,
  };
})();

window.UserProfile = UserProfile;
