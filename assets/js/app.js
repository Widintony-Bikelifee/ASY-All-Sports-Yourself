/**
 * app.js script file.
 * Archivo de script app.js.
 */
"use strict";

/**
 * Application helper module for toast messages and page navigation.
 * Módulo de ayuda de la aplicación para mensajes toast y navegación de páginas.
 */

const App = (() => {
  let _toastTimer = null;

  /**
   * Show a temporary toast notification.
   * Muestra una notificación toast temporal.
   */
  
  function showToast(message, duration = 3000) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    if (_toastTimer) clearTimeout(_toastTimer);

    toast.textContent = message;
    toast.classList.add("toast--visible");

    _toastTimer = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, duration);
  }

  /**
   * Navigate to a named page route using relative paths.
   * Navega a una ruta de página nombrada usando rutas relativas.
   */
  
  function showPage(page) {
    const routes = {
      home: "pages/index.html",
      login: "pages/login.html",
      register: "pages/register.html",
      venues: "pages/venues.html",
      reservas: "pages/reservas.html",
      dashboard: "pages/user/user-dashboard.html",
      admin: "pages/admin/admin-dashboard.html",
    };

    const targetPath = routes[page];
    if (!targetPath) {
      console.warn(`[App.showPage] Página desconocida: "${page}"`);
      return;
    }

    const currentPath = window.location.pathname;
    const isRoot = !currentPath.includes("/pages/");
    if (isRoot) {
      window.location.href = targetPath;
      return;
    }

    const currentSubPath = currentPath.split("/pages/")[1] || "";
    const currentDepth = currentSubPath.split("/").length - 1;
    const base = currentDepth > 0 ? "../".repeat(currentDepth) : "";
    const relativeTarget = targetPath.replace("pages/", "");

    window.location.href = base + relativeTarget;
  }

  return { showToast, showPage };
})();

window.App = App;

/**
 * Attach logout behavior for authenticated sections after DOM content loads.
 * Adjunta el comportamiento de cierre de sesión para secciones autenticadas después de cargar el DOM.
 */

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.includes("/pages/user/") && !window.location.pathname.includes("/pages/admin/")) return;

  const logoutBtn = document.getElementById("btn-logout");
  const sidebarBrand = document.querySelector(".sidebar-header .navbar-brand");

  /**
   * PerformLogout.
   * Realiza.
   */
  
  async function performLogout() {
    if (window.supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.warn("Logout error:", error);
      }
    }

    const redirectUrl = new URL("../../index.html", window.location.href).toString();
    window.location.href = redirectUrl;
  }

  if (logoutBtn && !logoutBtn.dataset.logoutAttached) {
    logoutBtn.dataset.logoutAttached = "true";
    logoutBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      await performLogout();
    });
  }

  if (sidebarBrand && !sidebarBrand.dataset.logoAttached) {
    sidebarBrand.dataset.logoAttached = "true";
    sidebarBrand.addEventListener("click", async (event) => {
      event.preventDefault();
      if (confirm("¿Deseas cerrar sesión antes de salir?")) {
        await performLogout();
      }
    });
  }
});


