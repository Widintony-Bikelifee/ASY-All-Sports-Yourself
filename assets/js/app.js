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
    // Routes for pages in /pages/ directory
    const routes = {
      home: "./index.html",
      login: "login.html",
      register: "register.html",
      venues: "venues.html",
      reservas: "reservas.html",
      admin: "admin-dashboard.html",
    };

    // Check if we're in the root directory (not /pages/)
    const isRoot = !window.location.pathname.includes("/pages/");
    
    // Routes for pages at root level
    const rootRoutes = {
      home: "index.html",
      login: "pages/login.html",
      register: "pages/register.html",
      venues: "pages/venues.html",
      reservas: "pages/reservas.html",
      admin: "pages/admin-dashboard.html",
    };

    // Choose correct route based on current location
    const target = isRoot ? rootRoutes[page] : routes[page];
    
    // Navigate to target page if valid
    if (target) {
      window.location.href = target;
    } else {
      // Log warning for unknown page
      console.warn(`[App.showPage] Página desconocida: "${page}"`);
    }
  }

  // Public API - expose these functions externally
  return { showToast, showPage };
})();

// Expose App globally so it can be used in inline event handlers or other scripts
window.App = App;
