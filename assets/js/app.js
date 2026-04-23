"use strict";

/**
 * app.js — Global utilities for the ASY application
 * should be included in all pages to provide common functionality like toast messages and navigation.
 */
const App = (() => {
  let _toastTimer = null;

  /**
   * watch a toast message on the screen for a few seconds.
   * @param {string} message  — message to show in the toast
   * @param {number} duration — miliseconds to show the toast (default: 3000ms)
   */
  function showToast(message, duration = 3000) {
    // search for existing toast element, if not found, create it
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    // clear timer if a toast is already visible
    if (_toastTimer) clearTimeout(_toastTimer);

    toast.textContent = message;
    toast.classList.add("toast--visible");

    _toastTimer = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, duration);
  }

  /**
   * navigate to a different page within the application.
   * @param {'home'|'login'|'register'|'venues'} page
   */
  function showPage(page) {
    const routes = {
      home: "../index.html",
      login: "login.html",
      register: "register.html",
      venues: "venues.html",
    };

    // if we are in the root (index.html), adjust routes accordingly
    const isRoot = !window.location.pathname.includes("/pages/");
    const rootRoutes = {
      home: "index.html",
      login: "pages/login.html",
      register: "pages/register.html",
      venues: "pages/venues.html",
    };

    const target = isRoot ? rootRoutes[page] : routes[page];
    if (target) {
      window.location.href = target;
    } else {
      console.warn(`[App.showPage] Página desconocida: "${page}"`);
    }
  }

  return { showToast, showPage };
})();

// Expose App globally so it can be used in inline event handlers or other scripts
window.App = App;
