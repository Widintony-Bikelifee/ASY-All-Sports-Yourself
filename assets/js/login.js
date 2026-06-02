/* 
   login.js - Login page functionality
   Handles form validation, password visibility toggle,
   and user authentication via Supabase.
    */

/* 
   TOGGLE PASSWORD - Show/hide password field
   
   @param {string} inputId - ID of the password input element
   @param {HTMLElement} eyeEl - Eye icon element to update
   @returns {void}
   @description - Toggles between password and text type for visibility
   */
function togglePassword(inputId, eyeEl) {
  // Get the input element by ID
  const input = document.getElementById(inputId);
  if (!input) return;

  // Check current type and toggle between password/text
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  // Update eye icon SVG to show open/closed eye
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

/* 
   VALIDATION HELPERS - Email and password validation
    */

/* Validates email format using regex pattern
   @param {string} email - Email address to validate
   @returns {boolean} - True if valid email format */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* Validates password minimum length (8 characters)
   @param {string} pass - Password to validate
   @returns {boolean} - True if password meets minimum length */
function isValidPassword(pass) {
  return pass.length >= 8;
}

/* Returns or creates a Bootstrap invalid-feedback element for a field */
function getInvalidFeedback(input) {
  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  if (!wrap) return null;

  let feedback = wrap.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    wrap.parentNode.insertBefore(feedback, wrap.nextSibling);
  }
  return feedback;
}

/* Shows error message for a form field
   @param {string} fieldId - ID of the input element
   @param {string} message - Error message to display
   @returns {void} */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  // Add Bootstrap invalid state, remove success classes
  input.classList.add('is-invalid');
  input.classList.remove('is-valid', 'input--error', 'input--ok');

  const feedback = getInvalidFeedback(input);
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.add('d-block');
  }
}

/* Shows success state for a form field
   @param {string} fieldId - ID of the input element
   @returns {void} */
function setFieldOk(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.classList.remove('is-invalid', 'input--error', 'input--ok');
  input.classList.add('is-valid');

  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  const feedback = wrap?.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = '';
    feedback.classList.remove('d-block');
  }
}

/* 
   Login Module - Main login form logic
   
   Uses IIFE pattern to encapsulate login functionality
   */
const Login = (() => {

  /* Gets form data from email and password inputs
     @returns {object} - { email: string, password: string } */
  function getFormData() {
    return {
      email:    document.getElementById('login-email')?.value.trim() || '',
      password: document.getElementById('login-password')?.value || '',
    };
  }

  /* Validates a single field on blur or input
     @param {string} fieldId - ID of the field to validate
     @returns {void} */
  function validateField(fieldId) {
    const { email, password } = getFormData();

    // Validate email field
    if (fieldId === 'login-email') {
      if (!email)                    setFieldError('login-email', 'El correo es obligatorio.');
      else if (!isValidEmail(email)) setFieldError('login-email', 'Formato de correo invalido.');
      else                           setFieldOk('login-email');
    }

    // Validate password field
    if (fieldId === 'login-password') {
      if (!password) setFieldError('login-password', 'La contrasena es obligatoria.');
      else           setFieldOk('login-password');
    }
  }

  /* Validates entire form before submission
     @returns {boolean} - True if all fields are valid */
  function validate() {
    const { email, password } = getFormData();
    let ok = true;

    // Email validation
    if (!email) {
      setFieldError('login-email', 'El correo es obligatorio.'); ok = false;
    } else if (!isValidEmail(email)) {
      setFieldError('login-email', 'Formato de correo invalido.'); ok = false;
    } else {
      setFieldOk('login-email');
    }

    // Password validation
    if (!password) {
      setFieldError('login-password', 'La contrasena es obligatoria.'); ok = false;
    } else {
      setFieldOk('login-password');
    }

    return ok;
  }

  /* Handles form submission - validates and authenticates user
     @returns {Promise<void>}
     @description - Calls authService.loginUser, shows toast, redirects on success */
  async function handleSubmit() {
    // Stop if validation fails
    if (!validate()) return;

    const { email, password } = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      // Disable button and show loading state
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Iniciando sesion...';
      }
      
      // Call authentication service
      const usuario = await loginUser(email, password);

      // Show welcome message and redirect based on role
      const rol = usuario.rol || 'user';
      App.showToast('Bienvenido, ' + usuario.nombre + '!');

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

      // Map common Supabase errors to user-friendly messages
      const mensajes = {
        'Invalid login credentials': 'Correo o contrasena incorrectos.',
        'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesion.',
        'Too many requests': 'Demasiados intentos. Espera un momento.',
      };

      // Show error message, restore button
      const msg = mensajes[err.message] || err.message;
      setFieldError('login-email', msg);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesion';
      }
    }
  }

  /* Initializes event listeners for form fields
     @returns {void}
     @description - Attaches blur and input listeners for validation */
  function init() {
    ['login-email', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // Validate on blur (when user leaves field)
      el.addEventListener('blur',  () => validateField(id));
      // Re-validate on input if field has error
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) validateField(id); });
    });
  }

  // Public API - expose these functions externally
  return { handleSubmit, init };
})();

/* 
   INITIALIZATION - Set up login on page load
  
   @description - Initializes Login module when DOM is ready
   */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-email')) Login.init();
});

// Expose globally for inline onclick handlers
window.togglePassword = togglePassword;
window.Login         = Login;
