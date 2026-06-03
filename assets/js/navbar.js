


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


(async function initDualNavbar() {

  
  let session = null;
  if (window.supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session  = data?.session ?? null;
    } catch (e) {
      console.warn("Error getting supabase session:", e);
    }
  }

  
  const guestNav = document.getElementById("navbar-guest");
  const userNav  = document.getElementById("navbar-user");
  const adminNav = document.getElementById("navbar-admin");

  if (session) {
    
    let role = 'user';
    if (window.getUserRole) {
      role = await window.getUserRole();
    }

    if (role === 'admin_cancha' && adminNav) {
      
      adminNav.classList.remove("navbar-wrapper--hidden");
      guestNav?.classList.add("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      
      if (userNav) {
        userNav.classList.remove("navbar-wrapper--hidden");
        guestNav?.classList.add("navbar-wrapper--hidden");
        adminNav?.classList.add("navbar-wrapper--hidden");
        setupUserNavbar(session.user, "user-");
      } else {
        
        guestNav?.classList.remove("navbar-wrapper--hidden");
        setupGuestNavbar();
      }
    }
  } else {
    
    if (guestNav) {
      guestNav.classList.remove("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      adminNav?.classList.add("navbar-wrapper--hidden");
      setupGuestNavbar();
    } else {
      
      const defaultNav = document.getElementById("navbar");
      if (defaultNav) {
        setupGuestNavbar();
      }
    }
  }

  if (session) {
    setupHomePageLogoutInterception();
  }

  setupMockLinks();

})();






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


(async function initDualNavbar() {

  
  let session = null;
  if (window.supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session  = data?.session ?? null;
    } catch (e) {
      console.warn("Error getting supabase session:", e);
    }
  }

  
  const guestNav = document.getElementById("navbar-guest");
  const userNav  = document.getElementById("navbar-user");
  const adminNav = document.getElementById("navbar-admin");

  if (session) {
    
    let role = 'user';
    if (window.getUserRole) {
      role = await window.getUserRole();
    }

    if (role === 'admin_cancha' && adminNav) {
      
      adminNav.classList.remove("navbar-wrapper--hidden");
      guestNav?.classList.add("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      
      if (userNav) {
        userNav.classList.remove("navbar-wrapper--hidden");
        guestNav?.classList.add("navbar-wrapper--hidden");
        adminNav?.classList.add("navbar-wrapper--hidden");
        setupUserNavbar(session.user, "user-");
      } else {
        
        guestNav?.classList.remove("navbar-wrapper--hidden");
        setupGuestNavbar();
      }
    }
  } else {
    
    if (guestNav) {
      guestNav.classList.remove("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      adminNav?.classList.add("navbar-wrapper--hidden");
      setupGuestNavbar();
    } else {
      
      const defaultNav = document.getElementById("navbar");
      if (defaultNav) {
        setupGuestNavbar();
      }
    }
  }

  if (session) {
    setupHomePageLogoutInterception();
  }

  setupMockLinks();

})();






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


(async function initDualNavbar() {

  
  let session = null;
  if (window.supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session  = data?.session ?? null;
    } catch (e) {
      console.warn("Error getting supabase session:", e);
    }
  }

  
  const guestNav = document.getElementById("navbar-guest");
  const userNav  = document.getElementById("navbar-user");
  const adminNav = document.getElementById("navbar-admin");

  if (session) {
    
    let role = 'user';
    if (window.getUserRole) {
      role = await window.getUserRole();
    }

    if (role === 'admin_cancha' && adminNav) {
      
      adminNav.classList.remove("navbar-wrapper--hidden");
      guestNav?.classList.add("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      
      if (userNav) {
        userNav.classList.remove("navbar-wrapper--hidden");
        guestNav?.classList.add("navbar-wrapper--hidden");
        adminNav?.classList.add("navbar-wrapper--hidden");
        setupUserNavbar(session.user, "user-");
      } else {
        
        guestNav?.classList.remove("navbar-wrapper--hidden");
        setupGuestNavbar();
      }
    }
  } else {
    
    if (guestNav) {
      guestNav.classList.remove("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      adminNav?.classList.add("navbar-wrapper--hidden");
      setupGuestNavbar();
    } else {
      
      const defaultNav = document.getElementById("navbar");
      if (defaultNav) {
        setupGuestNavbar();
      }
    }
  }

  if (session) {
    setupHomePageLogoutInterception();
  }

  setupMockLinks();

})();






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


(async function initDualNavbar() {

  
  let session = null;
  if (window.supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session  = data?.session ?? null;
    } catch (e) {
      console.warn("Error getting supabase session:", e);
    }
  }

  
  const guestNav = document.getElementById("navbar-guest");
  const userNav  = document.getElementById("navbar-user");
  const adminNav = document.getElementById("navbar-admin");

  if (session) {
    
    let role = 'user';
    if (window.getUserRole) {
      role = await window.getUserRole();
    }

    if (role === 'admin_cancha' && adminNav) {
      
      adminNav.classList.remove("navbar-wrapper--hidden");
      guestNav?.classList.add("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      setupUserNavbar(session.user, "admin-");
    } else {
      
      if (userNav) {
        userNav.classList.remove("navbar-wrapper--hidden");
        guestNav?.classList.add("navbar-wrapper--hidden");
        adminNav?.classList.add("navbar-wrapper--hidden");
        setupUserNavbar(session.user, "user-");
      } else {
        
        guestNav?.classList.remove("navbar-wrapper--hidden");
        setupGuestNavbar();
      }
    }
  } else {
    
    if (guestNav) {
      guestNav.classList.remove("navbar-wrapper--hidden");
      userNav?.classList.add("navbar-wrapper--hidden");
      adminNav?.classList.add("navbar-wrapper--hidden");
      setupGuestNavbar();
    } else {
      
      const defaultNav = document.getElementById("navbar");
      if (defaultNav) {
        setupGuestNavbar();
      }
    }
  }

  if (session) {
    setupHomePageLogoutInterception();
  }

  setupMockLinks();

})();



/**
 * SetupGuestNavbar.
 * Realiza.
 */

function setupGuestNavbar() {
  const hamburger  = document.getElementById("guest-hamburger") || document.getElementById("navbar-hamburger");
  const mobileMenu = document.getElementById("guest-mobile-menu") || document.getElementById("navbar-mobile-menu");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () =>
      mobileMenu.classList.toggle("open")
    );
    /**
     * Initialize page scripting once DOM content is ready.
     * Inicializa el script de la página cuando el contenido DOM está listo.
     */
    
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }
}



/**
 * SetupUserNavbar.
 * Realiza.
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

  
  const hamburger  = document.getElementById(`${prefix}hamburger`);
  const mobileMenu = document.getElementById(`${prefix}mobile-menu`);

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () =>
      mobileMenu.classList.toggle("open")
    );
    /**
     * Initialize page scripting once DOM content is ready.
     * Inicializa el script de la página cuando el contenido DOM está listo.
     */
    
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }

  
  const trigger  = document.getElementById(`${prefix}trigger`);
  const dropdown = document.getElementById(`${prefix}dropdown`);

  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
      trigger.classList.toggle("active");

      
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

  
  setupNotifications(prefix);

  
  const desktopLogout = document.getElementById(prefix === "admin-" ? "btn-logout-admin" : "btn-logout");
  const mobileLogout  = document.getElementById(prefix === "admin-" ? "btn-logout-mobile-admin" : "btn-logout-mobile");
  
  desktopLogout?.addEventListener("click", logout);
  mobileLogout?.addEventListener("click", logout);
}


/**
 * Logout.
 * Cerrar sesión.
 */

async function logout() {
  if (window.supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  
  const path = window.location.pathname;
  const isNested = path.includes('/pages/user/') || path.includes('/pages/admin/');
  const isSubPage = path.includes('/pages/') && !isNested;
  window.location.href = isNested ? "../login.html" : (isSubPage ? "login.html" : "pages/login.html");
}



/**
 * Get notifications.
 * Obtener notifications.
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

/**
 * Save notifications.
 * Guardar notifications.
 */

function saveNotifications(type, notis) {
  const key = `asy_notifications_${type}`;
  localStorage.setItem(key, JSON.stringify(notis));
}

/**
 * Update notification ui.
 * Actualizar notification ui.
 */

function updateNotificationUI(prefix) {
  const type = prefix === 'admin-' ? 'admin' : 'user';
  const notis = getNotifications(type);
  
  const badge = document.getElementById(`${prefix}noti-badge`);
  const list = document.getElementById(`${prefix}noti-list`);
  const clearBtn = document.getElementById(`${prefix}noti-clear`);

  if (!list) return;

  const unreadCount = notis.filter(n => !n.read).length;

  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  
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

    
    list.querySelectorAll('.navbar__noti-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const notiId = item.getAttribute('data-id');
        markNotificationAsRead(type, notiId, prefix);
      });
    });
  }
}

/**
 * MarkNotificationAsRead.
 * Realiza.
 */

function markNotificationAsRead(type, id, prefix) {
  let notis = getNotifications(type);
  notis = notis.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(type, notis);
  updateNotificationUI(prefix);
}

/**
 * MarkAllAsRead.
 * Realiza.
 */

function markAllAsRead(type, prefix) {
  let notis = getNotifications(type);
  notis = notis.map(n => ({ ...n, read: true }));
  saveNotifications(type, notis);
  updateNotificationUI(prefix);
}

/**
 * SetupNotifications.
 * Realiza.
 */

function setupNotifications(prefix) {
  const type = prefix === 'admin-' ? 'admin' : 'user';
  const trigger = document.getElementById(`${prefix}noti-trigger`);
  const dropdown = document.getElementById(`${prefix}noti-dropdown`);
  const clearBtn = document.getElementById(`${prefix}noti-clear`);

  if (!trigger || !dropdown) return;

  
  updateNotificationUI(prefix);

  
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    trigger.classList.toggle('active');

    
    const userDropdown = document.getElementById(`${prefix}dropdown`);
    const userTrigger = document.getElementById(`${prefix}trigger`);
    if (userDropdown) userDropdown.classList.remove('open');
    if (userTrigger) userTrigger.classList.remove('active');
  });

  
  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    markAllAsRead(type, prefix);
  });

  
  /**
   * Initialize page scripting once DOM content is ready.
   * Inicializa el script de la página cuando el contenido DOM está listo.
   */
  
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
  });
}


/**
 * InitMockFeatureModal.
 * Realiza.
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

/**
 * Show mock feature modal.
 * Mostrar mock feature modal.
 */

function showMockFeatureModal(name, desc, icon) {
  initMockFeatureModal();
  const modal = document.getElementById('navbar-feature-modal');
  if (!modal) return;

  modal.querySelector('#navbar-modal-title').textContent = name;
  modal.querySelector('#navbar-modal-desc').textContent = desc;
  modal.querySelector('#navbar-modal-icon').textContent = icon || '🚀';
  modal.classList.add('open');
}

/**
 * SetupMockLinks.
 * Realiza.
 */

function setupMockLinks() {
  /**
   * Initialize page scripting once DOM content is ready.
   * Inicializa el script de la página cuando el contenido DOM está listo.
   */
  
  document.addEventListener('click', (e) => {
    
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



/**
 * SetupHomePageLogoutInterception.
 * Realiza.
 */

function setupHomePageLogoutInterception() {
  
  const path = window.location.pathname;
  const isHomePage = path === '/' ||
                     path.endsWith('/index.html') ||
                     path.endsWith('/ASY-All-Sports-Yourself/') ||
                     path.endsWith('/ASY-All-Sports-Yourself/index.html');

  if (!isHomePage) return;

  
  /**
   * Initialize page scripting once DOM content is ready.
   * Inicializa el script de la página cuando el contenido DOM está listo.
   */
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    
    const href = link.getAttribute('href') || '';
    const isHomeLink =
      href === './' ||
      href === './index.html' ||
      href === '../index.html' ||
      href === '/' ||
      href === '/index.html' ||
      href === '#' && link.classList.contains('navbar__brand');

    if (!isHomeLink) return;

    
    const inGuestNav = link.closest('#navbar-guest');
    if (inGuestNav) return;  

    
    e.preventDefault();
    showLogoutConfirmModal();
  });
}


/**
 * Show logout confirm modal.
 * Mostrar logout confirm modal.
 */

function showLogoutConfirmModal() {
  
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

    
    overlay.querySelector('#logout-confirm-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    
    overlay.querySelector('#logout-confirm-ok').addEventListener('click', async () => {
      const btn = overlay.querySelector('#logout-confirm-ok');
      btn.textContent = 'Cerrando…';
      btn.disabled = true;
      if (window.supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      
      window.location.reload();
    });

    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  
  requestAnimationFrame(() => overlay.classList.add('open'));
}
