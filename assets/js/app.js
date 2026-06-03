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

  // --- MOBILE SIDEBAR RESPONSIVENESS INJECTION / INYECCIÓN DE RESPONSIVIDAD PARA EL SIDEBAR EN MÓVILES ---
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    // 1. Create and inject fixed mobile header (visible only on small screens) / Crear e inyectar la cabecera móvil fija (visible solo en pantallas pequeñas)
    const mobileHeader = document.createElement("div");
    mobileHeader.className = "mobile-header d-lg-none fixed-top bg-white border-bottom px-3 py-2 d-flex align-items-center justify-content-between";
    mobileHeader.style.cssText = "z-index: 1020; height: 60px;";
    mobileHeader.innerHTML = `
      <div class="d-flex align-items-center">
        <button class="btn btn-link text-dark p-1 me-2" id="mobile-sidebar-toggle" aria-label="Abrir menú">
          <i class="bi bi-list fs-2"></i>
        </button>
        <a href="../../index.html" class="d-flex align-items-center gap-2 text-decoration-none">
          <img src="../../assets/img/Logo-ASY.png" alt="Logo ASY" width="36" height="36" />
          <span class="fw-bold text-dark fs-6" style="font-family: var(--font-display, 'Poppins', sans-serif); letter-spacing: 0.5px;">All Sports Yourself</span>
        </a>
      </div>
      <div></div>
    `;
    document.body.prepend(mobileHeader);

    // 2. Create and inject backdrop overlay to close sidebar on click / Crear e inyectar el backdrop para cerrar el sidebar al hacer click fuera
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);

    // 3. Event handlers to open and close the menu / Manejadores de eventos para abrir y cerrar el menú
    const toggleBtn = document.getElementById("mobile-sidebar-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.add("show");
        backdrop.classList.add("show");
      });
    }

    /** Close sidebar and backdrop / Cerrar sidebar y backdrop */
    const closeSidebar = () => {
      sidebar.classList.remove("show");
      backdrop.classList.remove("show");
    };

    backdrop.addEventListener("click", closeSidebar);

    // Automatically close when clicking any navigation link inside sidebar / Cerrar automáticamente al hacer click en cualquier link de navegación interna del sidebar
    const sidebarLinks = sidebar.querySelectorAll(".nav-link");
    sidebarLinks.forEach(link => {
      link.addEventListener("click", closeSidebar);
    });
  }
  // --- END OF MOBILE SIDEBAR INJECTION / FIN DE INYECCIÓN DE RESPONSIVIDAD PARA EL SIDEBAR EN MÓVILES ---



  const logoutBtn = document.getElementById("btn-logout");
  const sidebarBrand = document.querySelector(".sidebar-header .navbar-brand");

  /**
   * Sign out user and redirect to login / Cerrar sesión y redirigir al login
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


