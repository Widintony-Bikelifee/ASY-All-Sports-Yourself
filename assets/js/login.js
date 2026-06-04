/**
 * Toggle the password visibility icon and input state.
 * Alterna el estado de visibilidad de la contraseña e icono.
 */

function togglePassword(inputId, eyeEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (eyeEl) {
    eyeEl.innerHTML = isPassword
      ? `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
           <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8
                    a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8
                    a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
           <circle cx="12" cy="12" r="3"/>
         </svg>`;
  }
}

/**
 * Check whether the email string has a valid format.
 * Verifica si la cadena de correo electrónico tiene un formato válido.
 */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Check whether the password meets minimum requirements.
 * Verifica si la contraseña cumple con los requisitos mínimos.
 */

function isValidPassword(pass) {
  return pass.length >= 8;
}

/**
 * Form validation error helper functions are centralized in App (app.js).
 */
const setFieldError = App.setFieldError;
const setFieldOk = App.setFieldOk;

/**
 * Login module with validation helpers and submission workflow.
 * Módulo de login con ayudas de validación y flujo de envío.
 */

const Login = (() => {
  /**
   * Get current values from the login form.
   * Obtiene los valores actuales del formulario de login.
   */
  
  function getFormData() {
    return {
      email:    document.getElementById('login-email')?.value.trim() || '',
      password: document.getElementById('login-password')?.value || '',
    };
  }

  /**
   * Validate a specific field when it changes.
   * Valida un campo específico cuando cambia.
   */
  
  function validateField(fieldId) {
    const { email, password } = getFormData();

    if (fieldId === 'login-email') {
      if (!email)                    setFieldError('login-email', 'El correo es obligatorio.');
      else if (!isValidEmail(email)) setFieldError('login-email', 'Formato de correo invalido.');
      else                           setFieldOk('login-email');
    }

    if (fieldId === 'login-password') {
      if (!password) setFieldError('login-password', 'La contrasena es obligatoria.');
      else           setFieldOk('login-password');
    }
  }

  /**
   * Validate all login fields before submitting.
   * Valida todos los campos de login antes de enviar.
   */
  
  function validate() {
    const { email, password } = getFormData();
    let ok = true;

    if (!email) {
      setFieldError('login-email', 'El correo es obligatorio.'); ok = false;
    } else if (!isValidEmail(email)) {
      setFieldError('login-email', 'Formato de correo invalido.'); ok = false;
    } else {
      setFieldOk('login-email');
    }

    if (!password) {
      setFieldError('login-password', 'La contrasena es obligatoria.'); ok = false;
    } else {
      setFieldOk('login-password');
    }

    return ok;
  }

  /**
   * Handle the login button click, authenticate, and redirect.
   * Maneja el clic del botón de login, autentica y redirige.
   */
  
  async function handleSubmit() {
    if (!validate()) return;

    const { email, password } = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Iniciando sesion...';
      }

      const usuario = await loginUser(email, password);
      const rol = usuario.rol || 'user';
      App.showToast('Bienvenido, ' + usuario.nombre + '!');

      /**
       * pendingVenue module.
       * Realiza module.
       */
      
      const pendingVenue = (() => {
        try {
          return JSON.parse(sessionStorage.getItem('pendingVenue'));
        } catch {
          return null;
        }
      })();

      setTimeout(() => {
        if (pendingVenue && rol !== 'admin_cancha') {
          sessionStorage.removeItem('pendingVenue');
          window.location.href = `venues.html?pendingVenueId=${encodeURIComponent(pendingVenue.id)}`;
          return;
        }

        if (rol === 'admin_cancha') {
          window.location.href = 'admin/admin-dashboard.html';
        } else {
          window.location.href = 'user/user-dashboard.html';
        }
      }, 1500);

    } catch (err) {
      console.error('Error en login:', err);

      const mensajes = {
        'Invalid login credentials': 'Correo o contrasena incorrectos.',
        'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesion.',
        'Too many requests': 'Demasiados intentos. Espera un momento.',
      };

      const msg = mensajes[err.message] || err.message;
      setFieldError('login-email', msg);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesion';
      }
    }
  }

  /**
   * Attach event listeners for login field validation.
   * Adjunta eventos para validar los campos de login.
   */
  
  function init() {
    ['login-email', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      el.addEventListener('blur', () => validateField(id));
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) validateField(id); });
    });
  }

  /**
   * Handle Google login button behaviour.
   * Maneja el comportamiento del botón de login con Google.
   */
  
  async function handleGoogle(btn) {
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
          Conectando con Google...
        `;
      }
      await loginWithGoogle();
    } catch (err) {
      console.error('[Login] Google OAuth error:', err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.3 0 24 0 14.7 0 6.8 5.5 3 13.5l7.9 6.1C12.8 13.3 17.9 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16.3z"/>
            <path fill="#FBBC05" d="M10.9 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6L2.3 13.3A23.8 23.8 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.4-6z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2.1 1.4-4.8 2.3-8.8 2.3-6.1 0-11.2-3.8-13.1-9.1l-7.9 6.1C6.8 42.5 14.7 48 24 48z"/>
          </svg>
          Continuar con Google
        `;
      }
      if (typeof App !== 'undefined') {
        App.showToast('Error al conectar con Google. Inténtalo de nuevo.');
      }
    }
  }

  return { handleSubmit, handleGoogle, init };
})();

window.Login = Login;

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-email')) Login.init();
});


window.togglePassword = togglePassword;
window.Login         = Login;
