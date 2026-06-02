"use strict";

/* 
   app.js - Global utilities for ASY application
   Should be included in all pages to provide common functionality
   like toast notifications and page navigation.
    */

// IIFE (Immediately Invoked Function Expression) for encapsulation
const App = (() => {
  // Private variable to store toast timer reference
  let _toastTimer = null;

  /* 
     SHOW TOAST - Display temporary notification
     
     @param {string} message  - Text to display in the toast
     @param {number} duration - Milliseconds to show (default: 3000ms)
     @returns {void}
     @description - Shows a toast message on screen for a few seconds
     */
  function showToast(message, duration = 3000) {
    // Search for existing toast element, create if not found
    let toast = document.getElementById("toast");
    if (!toast) {
      // Create new toast element
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    // Clear existing timer if toast is already visible
    if (_toastTimer) clearTimeout(_toastTimer);

    // Set message and show toast
    toast.textContent = message;
    toast.classList.add("toast--visible");

    // Hide toast after duration
    _toastTimer = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, duration);
  }

  /* 
     SHOW PAGE - Navigate to different page
     
     @param {string} page - Target page: 'home'|'login'|'register'|'venues'
     @returns {void}
     @description - Redirects to the specified page within the application
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
    const relativeTarget = targetPath.replace(/^pages\//, "");

    window.location.href = base + relativeTarget;
  }

  // Public API - expose these functions externally
  return { showToast, showPage };
})();

// Expose App globally so it can be used in inline event handlers or other scripts
window.App = App;

