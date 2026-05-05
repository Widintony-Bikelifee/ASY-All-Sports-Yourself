/* ═══════════════════════════════════════
   navbar.js - Dual navigation bar system
   Shows different navbar for guests vs authenticated users.
   Queries Supabase session and displays the appropriate navbar.
   Both navbars exist in HTML but are hidden by default.
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   INITIALIZATION - IIFE to initialize navbar on load
   ═══════════════════════════════════════
   @description - Immediately invoked function that checks session
                  and shows either guest or user navbar
   */
(async function initDualNavbar() {

  /* Step 1: Check Supabase session
     @returns {object|null} - Session object or null if not authenticated */
  const { data } = await supabaseClient.auth.getSession();
  const session  = data?.session ?? null;

  /* Step 2: Show the appropriate navbar based on session
     @description - Unhides guest, user, or admin navbar and sets up event handlers */
  const guestNav = document.getElementById("navbar-guest");
  const userNav  = document.getElementById("navbar-user");
  const adminNav = document.getElementById("navbar-admin");

  if (session) {
    // Get user role
    let role = 'user';
    if (window.getUserRole) {
      role = await window.getUserRole();
    }

    if (role === 'admin_cancha' && adminNav) {
      // Admin is logged in - show admin navbar
      adminNav.classList.remove("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      // User is logged in - show user navbar
      userNav?.classList.remove("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "user-");
    }
  } else {
    // User is not logged in - show guest navbar
    guestNav?.classList.remove("navbar-wrapper--hidden");
    setupGuestNavbar();
  }

})();


/* ═══════════════════════════════════════
   GUEST NAVBAR - Setup for non-authenticated users
   ═══════════════════════════════════════
   @returns {void}
   @description - Sets up hamburger menu toggle for mobile
   */
function setupGuestNavbar() {
  // Get hamburger button and mobile menu elements
  const hamburger  = document.getElementById("guest-hamburger");
  const mobileMenu = document.getElementById("guest-mobile-menu");

  if (hamburger && mobileMenu) {
    // Toggle menu open/closed on hamburger click
    hamburger.addEventListener("click", () =>
      mobileMenu.classList.toggle("open")
    );
    // Close menu when clicking outside of it
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }
}


/* ═══════════════════════════════════════
   USER NAVBAR - Setup for authenticated users
   ═══════════════════════════════════════
   @param {object} user - Supabase user object from session
   @returns {void}
   @description - Sets up user display, mobile menu, and profile dropdown
   */
function setupUserNavbar(user, prefix = "user-") {

  /* ── Display Name ─────────────────────────────────────────────────────
     @description - Get user's name from metadata or fall back to email prefix
     */
  const displayName =
    user.user_metadata?.nombre      ||    // Custom nombre field
    user.user_metadata?.full_name   ||    // Full name field
    user.user_metadata?.name        ||    // Generic name field
    user.email.split("@")[0];              // Fall back to email username

  /* ── Avatar and Name Display ─────────────────────────────────────────
     @description - Populate user avatar (first letter) and name in navbar
     */
  const avatarEl = document.getElementById(`${prefix}avatar`);
  const nameEl   = document.getElementById(`${prefix}name`);

  if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
  if (nameEl)   nameEl.textContent   = displayName;

  /* ── Mobile Hamburger Menu ───────────────────────────────────────────
     @description - Same toggle behavior as guest navbar
     */
  const hamburger  = document.getElementById(`${prefix}hamburger`);
  const mobileMenu = document.getElementById(`${prefix}mobile-menu`);

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () =>
      mobileMenu.classList.toggle("open")
    );
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }

  /* ── Profile Dropdown ─────────────────────────────────────────────────
     @description - Toggle dropdown menu on profile trigger click
     */
  const trigger  = document.getElementById(`${prefix}trigger`);
  const dropdown = document.getElementById(`${prefix}dropdown`);

  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();  // Prevent document click from closing immediately
      dropdown.classList.toggle("open");
      trigger.classList.toggle("active");
    });
    // Close dropdown when clicking anywhere else
    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
      trigger.classList.remove("active");
    });
  }

  /* ── Logout Buttons ───────────────────────────────────────────────────
     @description - Attach click handlers to both desktop and mobile logout buttons
     */
  const desktopLogout = document.getElementById(prefix === "admin-" ? "btn-logout-admin" : "btn-logout");
  const mobileLogout  = document.getElementById(prefix === "admin-" ? "btn-logout-mobile-admin" : "btn-logout-mobile");
  
  desktopLogout?.addEventListener("click", logout);
  mobileLogout?.addEventListener("click", logout);
}

/* ═══════════════════════════════════════
   LOGOUT - Sign out user and redirect
   ═══════════════════════════════════════
   @returns {Promise<void>}
   @description - Calls Supabase signOut and redirects to login page
   */
async function logout() {
  // Sign out from Supabase
  await supabaseClient.auth.signOut();
  // Redirect to login page
  window.location.href = "login.html";
}
