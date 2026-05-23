/* ═══════════════════════════════════════
   navbar.js - Dual navigation bar system
   Shows different navbar for guests vs authenticated users.
   Queries Supabase session and displays the appropriate navbar.
   Both navbars exist in HTML but are hidden by default.
   ═══════════════════════════════════════ */

// Default mock notifications
const DEFAULT_USER_NOTIS = [
  { id: 'u1', text: "¡Tu reserva para este Sábado a las 10:00 en Cancha Sintética El Golazo ha sido CONFIRMADA! ⚽", read: false, time: "Hace 10 min", icon: "✅" },
  { id: 'u2', text: "Nuevo Torneo de Fútbol 5 en Ipiales. Inscripciones abiertas. ¡Premios en efectivo! 🏆", read: false, time: "Hace 2 horas", icon: "🏆" },
  { id: 'u3', text: "Has recibido 150 puntos Club ASY por tu última reserva jugada. 🏅", read: true, time: "Ayer", icon: "🎉" },
  { id: 'u4', text: "Completa tu perfil para recibir un 10% de descuento en tu próxima reserva. 🎁", read: true, time: "Hace 2 días", icon: "🎁" }
];

const DEFAULT_ADMIN_NOTIS = [
  { id: 'a1', text: "Nueva solicitud de reserva recibida de Juan Pérez para Cancha Sintética El Golazo (Viernes 18:00) 📅", read: false, time: "Hace 5 min", icon: "📥" },
  { id: 'a2', text: "La cancha 'Cancha de Tenis Club' ha sido reservada y pagada vía PSE. 💳", read: false, time: "Hace 1 hora", icon: "💰" },
  { id: 'a3', text: "Reporte de ventas mensual disponible para descarga. 📈", read: true, time: "Hace 1 día", icon: "📊" },
  { id: 'a4', text: "Felicidades, has alcanzado 50 reservas este mes. 🚀", read: true, time: "Hace 3 días", icon: "🌟" }
];

/* ═══════════════════════════════════════
   INITIALIZATION - IIFE to initialize navbar on load
   ═══════════════════════════════════════
   */
(async function initDualNavbar() {

  /* Step 1: Check Supabase session */
  let session = null;
  if (window.supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session  = data?.session ?? null;
    } catch (e) {
      console.warn("Error getting supabase session:", e);
    }
  }

  /* Step 2: Show the appropriate navbar based on session */
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
      guestNav?.classList.add("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      // User is logged in - show user navbar
      if (userNav) {
        userNav.classList.remove("navbar-wrapper--hidden");
        guestNav?.classList.add("navbar-wrapper--hidden");
        adminNav?.classList.add("navbar-wrapper--hidden");
        setupUserNavbar(session.user, "user-");
      } else {
        // Fallback to guest if userNav doesn't exist
        guestNav?.classList.remove("navbar-wrapper--hidden");
        setupGuestNavbar();
      }
    }
  } else {
    // User is not logged in - show guest navbar
    if (guestNav) {
      guestNav.classList.remove("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      adminNav?.classList.add("navbar-wrapper--hidden");
      setupGuestNavbar();
    } else {
      // Fallback
      const defaultNav = document.getElementById("navbar");
      if (defaultNav) {
        setupGuestNavbar();
      }
    }
  }

  // Setup listeners for mock features
  setupMockLinks();

  // On the home page: intercept logo/home clicks when logged in
  if (session) {
    setupHomePageLogoutInterception();
  }

})();


/* ═══════════════════════════════════════
   GUEST NAVBAR - Setup for non-authenticated users
   ═══════════════════════════════════════
   */
function setupGuestNavbar() {
  const hamburger  = document.getElementById("guest-hamburger") || document.getElementById("navbar-hamburger");
  const mobileMenu = document.getElementById("guest-mobile-menu") || document.getElementById("navbar-mobile-menu");

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

  // Build mega panel for guest navbar
  buildMegaPanel(document.getElementById('navbar-guest'));
}


/* ═══════════════════════════════════════
   USER/ADMIN NAVBAR - Setup for authenticated users
   ═══════════════════════════════════════
   */
function setupUserNavbar(user, prefix = "user-") {

  const displayName =
    user.user_metadata?.nombre      ||
    user.user_metadata?.full_name   ||
    user.user_metadata?.name        ||
    user.email.split("@")[0];

  const avatarEl = document.getElementById(`${prefix}avatar`);
  const nameEl   = document.getElementById(`${prefix}name`);

  if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
  if (nameEl)   nameEl.textContent   = displayName;

  // Mobile Hamburger Menu
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

  // Profile Dropdown
  const trigger  = document.getElementById(`${prefix}trigger`);
  const dropdown = document.getElementById(`${prefix}dropdown`);

  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
      trigger.classList.toggle("active");

      // Close notification dropdown if open
      const notiDropdown = document.getElementById(`${prefix}noti-dropdown`);
      const notiTrigger = document.getElementById(`${prefix}noti-trigger`);
      if (notiDropdown) notiDropdown.classList.remove("open");
      if (notiTrigger) notiTrigger.classList.remove("active");
    });
    
    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
      trigger.classList.remove("active");
    });
  }

  // Setup Notifications dropdown and badge
  setupNotifications(prefix);

  // Logout Buttons
  const desktopLogout = document.getElementById(prefix === "admin-" ? "btn-logout-admin" : "btn-logout");
  const mobileLogout  = document.getElementById(prefix === "admin-" ? "btn-logout-mobile-admin" : "btn-logout-mobile");
  
  desktopLogout?.addEventListener("click", logout);
  mobileLogout?.addEventListener("click", logout);

  // Build mega panel for this navbar
  const navbarEl = prefix === 'admin-'
    ? document.getElementById('navbar-admin')
    : document.getElementById('navbar-user');
  buildMegaPanel(navbarEl);
}

/* ═══════════════════════════════════════
   LOGOUT - Sign out user and redirect
   ═══════════════════════════════════════
   */
async function logout() {
  if (window.supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  // Redirect to login page. We might need to adjust relative path depending on where we are.
  const isSubPage = window.location.pathname.includes('/pages/');
  window.location.href = isSubPage ? "login.html" : "pages/login.html";
}

/* ═══════════════════════════════════════
   MEGA PANEL BUILDER
   Reads the <ul class="navbar__links"> from the given navbar wrapper,
   injects a "Menú" button inside .navbar__actions, and creates a
   full-width panel beneath the navbar with rich icon items.
   ═══════════════════════════════════════
   */
function buildMegaPanel(navbarWrapper) {
  if (!navbarWrapper) return;

  const nav    = navbarWrapper.querySelector('.navbar');
  const linksUl = navbarWrapper.querySelector('.navbar__links');
  if (!nav || !linksUl) return;

  // Gather link data from the <ul> items
  const linkItems = [];
  linksUl.querySelectorAll('li a').forEach(a => {
    linkItems.push({
      label:   a.textContent.trim(),
      href:    a.getAttribute('href'),
      isMock:  a.classList.contains('navbar__link--mock'),
      isActive: a.classList.contains('active'),
      feature: a.dataset.feature || '',
      icon:    a.dataset.icon    || '',
      desc:    a.dataset.desc    || '',
    });
  });

  if (linkItems.length === 0) return;

  // Map labels to descriptive sub-texts and icons for mega panel
  const META = {
    'Inicio':             { icon: '🏠', sub: 'Página principal' },
    'Panel Principal':    { icon: '📊', sub: 'Tu dashboard personal' },
    'Panel Admin':        { icon: '⚙️', sub: 'Gestión del club' },
    'Reservar Cancha':    { icon: '📅', sub: 'Busca y reserva' },
    'Mis Reservas':       { icon: '🗓️', sub: 'Historial y próximas' },
    'Mis Canchas':        { icon: '🏟️', sub: 'Administra tus espacios' },
    'Ver Catálogo':       { icon: '🔍', sub: 'Todos los escenarios' },
    'Espacios Deportivos':{ icon: '🏟️', sub: 'Explora el catálogo' },
    'Mis Estadísticas':   { icon: '📈', sub: 'Tu rendimiento' },
    'Buscar Compañeros':  { icon: '🤝', sub: 'Red deportiva' },
    'Retos':              { icon: '🎯', sub: 'Logros y descuentos' },
    'Historial Completo': { icon: '📋', sub: 'Reservas históricas' },
    'Gestión de Clientes':{ icon: '👥', sub: 'Lista de deportistas' },
    'Torneos y Eventos':  { icon: '🏅', sub: 'Competencias' },
    'Reportes y Ventas':  { icon: '📊', sub: 'Ingresos y estadísticas' },
    'Cómo Funciona':      { icon: '❓', sub: 'Guía de reservas' },
    'Torneos':            { icon: '🏆', sub: 'Próximos campeonatos' },
    'Beneficios':         { icon: '🎁', sub: 'Puntos y recompensas' },
    'Soporte':            { icon: '📞', sub: 'Ayuda 24/7' },
  };

  // Build the panel HTML
  const panelId = `mega-panel-${Math.random().toString(36).slice(2, 7)}`;

  const itemsHTML = linkItems.map(item => {
    const meta    = META[item.label] || {};
    const icon    = item.icon || meta.icon || '→';
    const sub     = meta.sub  || '';
    const mockBadge = item.isMock
      ? `<span class="navbar__mega-badge">Próx.</span>`
      : '';
    const activeClass = item.isActive ? 'active' : '';
    const mockClass   = item.isMock   ? 'navbar__link--mock' : '';

    return `
      <a
        href="${item.isMock ? '#' : item.href}"
        class="navbar__mega-item ${activeClass} ${mockClass}"
        ${item.isMock ? `data-feature="${item.feature}" data-icon="${icon}" data-desc="${item.desc}"` : ''}
      >
        <span class="navbar__mega-icon">${icon}</span>
        <span class="navbar__mega-item-text">
          <span class="navbar__mega-item-label">${item.label}</span>
          ${sub ? `<span class="navbar__mega-item-sub">${sub}</span>` : ''}
        </span>
        ${mockBadge}
      </a>`;
  }).join('');

  // Create the mega panel element (appended after .navbar)
  const panel = document.createElement('div');
  panel.className = 'navbar__mega-panel';
  panel.id = panelId;
  panel.innerHTML = `<div class="navbar__mega-inner">${itemsHTML}</div>`;
  navbarWrapper.appendChild(panel);

  // Create the Menú button and inject it into .navbar__actions
  const actions = nav.querySelector('.navbar__actions');
  if (!actions) return;

  const menuBtn = document.createElement('button');
  menuBtn.className = 'navbar__menu-btn';
  menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
  menuBtn.innerHTML = `
    Menú
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  `;
  // Insert menu button as the FIRST child of actions
  actions.insertBefore(menuBtn, actions.firstChild);

  // Toggle panel on button click
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    menuBtn.classList.toggle('active', isOpen);

    // Close other panels and dropdowns
    document.querySelectorAll('.navbar__mega-panel').forEach(p => {
      if (p !== panel) p.classList.remove('open');
    });
    document.querySelectorAll('.navbar__menu-btn').forEach(b => {
      if (b !== menuBtn) b.classList.remove('active');
    });
  });

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !menuBtn.contains(e.target)) {
      panel.classList.remove('open');
      menuBtn.classList.remove('active');
    }
  });

  // Close panel when a non-mock link is clicked
  panel.querySelectorAll('.navbar__mega-item:not(.navbar__link--mock)').forEach(link => {
    link.addEventListener('click', () => {
      panel.classList.remove('open');
      menuBtn.classList.remove('active');
    });
  });
}

/* ═══════════════════════════════════════
   NOTIFICATIONS MANAGEMENT
   ═══════════════════════════════════════
   */
function getNotifications(type) {
  const key = `asy_notifications_${type}`;
  let notis = localStorage.getItem(key);
  if (!notis) {
    const defaults = type === 'admin' ? DEFAULT_ADMIN_NOTIS : DEFAULT_USER_NOTIS;
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(notis);
}

function saveNotifications(type, notis) {
  const key = `asy_notifications_${type}`;
  localStorage.setItem(key, JSON.stringify(notis));
}

function updateNotificationUI(prefix) {
  const type = prefix === 'admin-' ? 'admin' : 'user';
  const notis = getNotifications(type);
  
  const badge = document.getElementById(`${prefix}noti-badge`);
  const list = document.getElementById(`${prefix}noti-list`);
  const clearBtn = document.getElementById(`${prefix}noti-clear`);

  if (!list) return;

  const unreadCount = notis.filter(n => !n.read).length;

  // Update badge
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Update list
  if (notis.length === 0) {
    list.innerHTML = `
      <div class="navbar__noti-empty">
        <span class="navbar__noti-empty-icon">🔔</span>
        <span>No tienes notificaciones</span>
      </div>
    `;
    if (clearBtn) clearBtn.style.display = 'none';
  } else {
    if (clearBtn) clearBtn.style.display = 'block';
    list.innerHTML = notis.map(noti => `
      <div class="navbar__noti-item ${noti.read ? '' : 'unread'}" data-id="${noti.id}">
        <span class="navbar__noti-icon-wrap">${noti.icon}</span>
        <div class="navbar__noti-content">
          <span class="navbar__noti-text">${noti.text}</span>
          <span class="navbar__noti-time">${noti.time}</span>
        </div>
        ${noti.read ? '' : '<span class="navbar__noti-dot"></span>'}
      </div>
    `).join('');

    // Attach click events to items to mark them as read
    list.querySelectorAll('.navbar__noti-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const notiId = item.getAttribute('data-id');
        markNotificationAsRead(type, notiId, prefix);
      });
    });
  }
}

function markNotificationAsRead(type, id, prefix) {
  let notis = getNotifications(type);
  notis = notis.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(type, notis);
  updateNotificationUI(prefix);
}

function markAllAsRead(type, prefix) {
  let notis = getNotifications(type);
  notis = notis.map(n => ({ ...n, read: true }));
  saveNotifications(type, notis);
  updateNotificationUI(prefix);
}

function setupNotifications(prefix) {
  const type = prefix === 'admin-' ? 'admin' : 'user';
  const trigger = document.getElementById(`${prefix}noti-trigger`);
  const dropdown = document.getElementById(`${prefix}noti-dropdown`);
  const clearBtn = document.getElementById(`${prefix}noti-clear`);

  if (!trigger || !dropdown) return;

  // Initial render
  updateNotificationUI(prefix);

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    trigger.classList.toggle('active');

    // Close other dropdowns (user profile dropdown)
    const userDropdown = document.getElementById(`${prefix}dropdown`);
    const userTrigger = document.getElementById(`${prefix}trigger`);
    if (userDropdown) userDropdown.classList.remove('open');
    if (userTrigger) userTrigger.classList.remove('active');
  });

  // Clear / mark all read button
  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    markAllAsRead(type, prefix);
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
  });
}

/* ═══════════════════════════════════════
   PROVISIONAL FEATURES MODAL LÓGICA
   ═══════════════════════════════════════
   */
function initMockFeatureModal() {
  if (document.getElementById('navbar-feature-modal')) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'navbar-feature-modal';
  modalOverlay.className = 'navbar-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="navbar-modal animate-fade-up">
      <button class="navbar-modal__close" id="navbar-modal-close" aria-label="Cerrar">&times;</button>
      <div class="navbar-modal__icon-container" id="navbar-modal-icon">🚀</div>
      <div class="navbar-modal__badge">Próximamente</div>
      <h3 class="navbar-modal__title" id="navbar-modal-title">Nueva Función</h3>
      <p class="navbar-modal__desc" id="navbar-modal-desc">Estamos trabajando en esta característica para ofrecértela muy pronto.</p>
      <button class="navbar-modal__btn" id="navbar-modal-btn">¡Entendido!</button>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const closeBtn = modalOverlay.querySelector('#navbar-modal-close');
  const actionBtn = modalOverlay.querySelector('#navbar-modal-btn');
  const closeModal = () => modalOverlay.classList.remove('open');

  closeBtn.addEventListener('click', closeModal);
  actionBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

function showMockFeatureModal(name, desc, icon) {
  initMockFeatureModal();
  const modal = document.getElementById('navbar-feature-modal');
  if (!modal) return;

  modal.querySelector('#navbar-modal-title').textContent = name;
  modal.querySelector('#navbar-modal-desc').textContent = desc;
  modal.querySelector('#navbar-modal-icon').textContent = icon || '🚀';
  modal.classList.add('open');
}

function setupMockLinks() {
  document.addEventListener('click', (e) => {
    // Find closest anchor or button that has the mock classes
    const link = e.target.closest('.navbar__link--mock, .navbar__dropdown-item--mock');
    if (link) {
      e.preventDefault();
      const name = link.getAttribute('data-feature') || 'Función';
      const desc = link.getAttribute('data-desc') || 'Estamos desarrollando esta característica.';
      const icon = link.getAttribute('data-icon') || '✨';
      showMockFeatureModal(name, desc, icon);
    }
  });
}


/* ═══════════════════════════════════════
   HOME PAGE LOGOUT INTERCEPTION
   When an authenticated user is already on index.html and clicks
   the logo or an "Inicio" link, ask them to confirm session close.
   ═══════════════════════════════════════
   */
function setupHomePageLogoutInterception() {
  // Only activate when the current page IS index.html (root or /index.html)
  const path = window.location.pathname;
  const isHomePage = path === '/' ||
                     path.endsWith('/index.html') ||
                     path.endsWith('/ASY-All-Sports-Yourself/') ||
                     path.endsWith('/ASY-All-Sports-Yourself/index.html');

  if (!isHomePage) return;

  // We intercept via a delegated listener to catch dynamically-visible navbars
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Only care about links that point to the home page
    const href = link.getAttribute('href') || '';
    const isHomeLink =
      href === './' ||
      href === './index.html' ||
      href === '../index.html' ||
      href === '/' ||
      href === '/index.html' ||
      href === '#' && link.classList.contains('navbar__brand');

    if (!isHomeLink) return;

    // Check this link lives inside a logged-in navbar (not the guest one)
    const inGuestNav = link.closest('#navbar-guest');
    if (inGuestNav) return;  // Guest navbar: no interception needed

    // Intercept: prevent navigation, show confirm modal
    e.preventDefault();
    showLogoutConfirmModal();
  });
}

/* ═══════════════════════════════════════
   LOGOUT CONFIRMATION MODAL
   ═══════════════════════════════════════
   */
function showLogoutConfirmModal() {
  // Reuse the existing modal overlay infrastructure
  let overlay = document.getElementById('navbar-logout-confirm-modal');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'navbar-logout-confirm-modal';
    overlay.className = 'navbar-modal-overlay';
    overlay.innerHTML = `
      <div class="navbar-modal animate-fade-up">
        <div class="navbar-modal__icon-container">🚪</div>
        <h3 class="navbar-modal__title">¿Cerrar sesión?</h3>
        <p class="navbar-modal__desc">
          Estás a punto de salir de tu cuenta y regresar a la página de bienvenida.
          ¿Deseas continuar?
        </p>
        <div class="navbar-modal__actions-wrap">
          <button class="navbar-modal__btn navbar-modal__btn--secondary" id="logout-confirm-cancel">
            Cancelar
          </button>
          <button class="navbar-modal__btn navbar-modal__btn--danger" id="logout-confirm-ok">
            Sí, cerrar sesión
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Cancel button
    overlay.querySelector('#logout-confirm-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    // Confirm button — sign out then reload so guest navbar appears
    overlay.querySelector('#logout-confirm-ok').addEventListener('click', async () => {
      const btn = overlay.querySelector('#logout-confirm-ok');
      btn.textContent = 'Cerrando…';
      btn.disabled = true;
      if (window.supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      // Reload index.html — now without a session, the guest navbar will appear
      window.location.reload();
    });

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  // Show with a small delay so the CSS transition fires
  requestAnimationFrame(() => overlay.classList.add('open'));
}
