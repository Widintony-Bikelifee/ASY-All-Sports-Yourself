"use strict";




const App = (() => {
  
  let _toastTimer = null;

  
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
    const relativeTarget = targetPath.replace(/^pages\

    window.location.href = base + relativeTarget;
  }

  
  return { showToast, showPage };
})();


window.App = App;

