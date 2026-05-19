"use strict";

/* 
   profile.js - User profile page logic
   Handles loading user data, populating the form, and saving changes.
*/

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("profile-form");
  const inputName = document.getElementById("profile-name");
  const inputLastname = document.getElementById("profile-lastname");
  const inputEmail = document.getElementById("profile-email");
  const inputPhone = document.getElementById("profile-phone");
  
  const avatarCircle = document.getElementById("profile-avatar");
  const displayName = document.getElementById("profile-display-name");
  const roleDisplay = document.getElementById("profile-role");
  const btnSave = document.getElementById("btn-save");

  let currentUserId = null;

  // 1. Verify session and fetch profile
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    
    if (!sessionData.session) {
      // Redirect to login if not authenticated
      window.location.href = "login.html";
      return;
    }
    
    currentUserId = sessionData.session.user.id;
    inputEmail.value = sessionData.session.user.email || ""; 
    
    // 2. Fetch Profile from 'usuarios' table using authService method
    if (window.getUserProfile) {
      const profile = await window.getUserProfile(currentUserId);
      
      // Populate form
      inputName.value = profile.nombre || "";
      inputLastname.value = profile.apellido || "";
      inputPhone.value = profile.telefono || "";
      
      // Optional: if the db has a specific email, use it over the auth one
      if (profile.correo_electronico) {
        inputEmail.value = profile.correo_electronico;
      }
      
      // Update UI displays
      displayName.textContent = `${profile.nombre || ""} ${profile.apellido || ""}`.trim();
      
      // Set avatar initial
      if (profile.nombre) {
        avatarCircle.textContent = profile.nombre.charAt(0).toUpperCase();
      } else if (profile.correo_electronico) {
        avatarCircle.textContent = profile.correo_electronico.charAt(0).toUpperCase();
      } else {
        avatarCircle.textContent = "U";
      }
      
      // Set Role badge
      if (profile.rol === "admin_cancha") {
        roleDisplay.innerHTML = "🏟️ Administrador";
      } else {
        roleDisplay.innerHTML = "🏃 Deportista";
      }
    }
  } catch (error) {
    console.error("Error al cargar el perfil:", error);
    if (window.App) {
      window.App.showToast("Error al cargar los datos del perfil.");
    }
  }

  // 3. Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      if (window.App) window.App.showToast("Error de sesión. Por favor inicia sesión nuevamente.");
      return;
    }
    
    const newName = inputName.value.trim();
    const newLastname = inputLastname.value.trim();
    const newPhone = inputPhone.value.trim();
    
    if (!newName || !newLastname) {
      if (window.App) window.App.showToast("El nombre y apellido son obligatorios.");
      return;
    }
    
    try {
      btnSave.disabled = true;
      btnSave.textContent = "Guardando...";
      
      if (window.updateUserProfile) {
        await window.updateUserProfile(currentUserId, {
          nombre: newName,
          apellido: newLastname,
          telefono: newPhone
        });
        
        if (window.App) window.App.showToast("Perfil actualizado correctamente.");
        
        // Update UI displays to reflect changes immediately
        displayName.textContent = `${newName} ${newLastname}`;
        avatarCircle.textContent = newName.charAt(0).toUpperCase();
        
        // Update the navbar user display if navbar.js loaded and methods exist
        const navUserName = document.getElementById("user-name");
        const navUserAvatar = document.getElementById("user-avatar");
        if (navUserName) navUserName.textContent = `${newName} ${newLastname}`;
        if (navUserAvatar) navUserAvatar.textContent = newName.charAt(0).toUpperCase();

        const navAdminName = document.getElementById("admin-name");
        const navAdminAvatar = document.getElementById("admin-avatar");
        if (navAdminName) navAdminName.textContent = `${newName} ${newLastname}`;
        if (navAdminAvatar) navAdminAvatar.textContent = newName.charAt(0).toUpperCase();
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      if (window.App) window.App.showToast("Ocurrió un error al guardar los cambios.");
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Guardar Cambios";
    }
  });
});
