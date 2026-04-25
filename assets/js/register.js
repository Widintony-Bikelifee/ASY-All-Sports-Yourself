/* ═══════════════════════════════════════
   register.js - Registration page functionality
   Handles form validation, password visibility toggle,
   and user registration via Supabase.
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   TOGGLE PASSWORD - Show/hide password field
   ═══════════════════════════════════════
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

/* ═══════════════════════════════════════
   VALIDATION HELPERS - Email and password validation
   ═══════════════════════════════════════ */

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

/* Shows error message for a form field
   @param {string} fieldId - ID of the input element
   @param {string} message - Error message to display
   @returns {void} */
function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  // Add error class, remove success class
  input.classList.add('input--error');
  input.classList.remove('input--ok');

  // Find or create hint element for error message
  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  let hint = wrap.querySelector('.form__field-hint');
  if (!hint) {
    hint = document.createElement('p');
    hint.className = 'form__field-hint';
    wrap.appendChild(hint);
  }
  // Display the error message
  hint.textContent = message;
  hint.style.display = 'block';
}

/* Shows success state for a form field
   @param {string} fieldId - ID of the input element
   @returns {void} */
function setFieldOk(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  // Remove error class, add success class
  input.classList.remove('input--error');
  input.classList.add('input--ok');

  // Hide any existing hint message
  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  const hint = wrap.querySelector('.form__field-hint');
  if (hint) hint.style.display = 'none';
}

/* ═══════════════════════════════════════
   Register Module - Main registration form logic
   ═══════════════════════════════════════
   Uses IIFE pattern to encapsulate registration functionality
   */
const Register = (() => {

  /* Gets form data from all registration inputs
     @returns {object} - { name, lastname, phone, email, password, password2, terms } */
  function getFormData() {
    return {
      name: document.getElementById('reg-name')?.value.trim() || '',
      lastname: document.getElementById('reg-lastname')?.value.trim() || '',
      phone: document.getElementById('reg-phone')?.value.trim() || '',
      email: document.getElementById('reg-email')?.value.trim() || '',
      password: document.getElementById('reg-password')?.value || '',
      password2: document.getElementById('reg-password2')?.value || '',
      terms: document.getElementById('reg-terms')?.checked || false,
    };
  }

  /* Validates a single field on blur or input
     @param {string} fieldId - ID of the field to validate
     @returns {void} */
  function validateField(fieldId) {
    const data = getFormData();

    switch (fieldId) {
      case 'reg-name':
        // Name is required
        if (!data.name) setFieldError('reg-name', 'El nombre es obligatorio.');
        else setFieldOk('reg-name');
        break;
      case 'reg-lastname':
        // Lastname is required
        if (!data.lastname) setFieldError('reg-lastname', 'El apellido es obligatorio.');
        else setFieldOk('reg-lastname');
        break;
      case 'reg-email':
        // Email required and must be valid format
        if (!data.email) setFieldError('reg-email', 'El correo es obligatorio.');
        else if (!isValidEmail(data.email)) setFieldError('reg-email', 'Formato de correo invalido.');
        else setFieldOk('reg-email');
        break;
      case 'reg-password':
        // Password required, minimum 8 chars
        if (!data.password) setFieldError('reg-password', 'La contrasena es obligatoria.');
        else if (!isValidPassword(data.password)) setFieldError('reg-password', 'Minimo 8 caracteres.');
        else setFieldOk('reg-password');
        // Also re-validate confirmation if filled
        if (data.password2) validateField('reg-password2');
        break;
      case 'reg-password2':
        // Must match password
        if (!data.password2) setFieldError('reg-password2', 'Confirma tu contrasena.');
        else if (data.password !== data.password2) setFieldError('reg-password2', 'Las contrasenas no coinciden.');
        else setFieldOk('reg-password2');
        break;
    }
  }

  /* Validates entire form before submission
     @returns {boolean} - True if all fields are valid */
  function validate() {
    const data = getFormData();
    let ok = true;

    // Name validation
    if (!data.name) {
      setFieldError('reg-name', 'El nombre es obligatorio.'); ok = false;
    } else { setFieldOk('reg-name'); }

    // Lastname validation
    if (!data.lastname) {
      setFieldError('reg-lastname', 'El apellido es obligatorio.'); ok = false;
    } else { setFieldOk('reg-lastname'); }

    // Email validation
    if (!data.email) {
      setFieldError('reg-email', 'El correo es obligatorio.'); ok = false;
    } else if (!isValidEmail(data.email)) {
      setFieldError('reg-email', 'Formato de correo invalido.'); ok = false;
    } else { setFieldOk('reg-email'); }

    // Password validation
    if (!data.password) {
      setFieldError('reg-password', 'La contrasena es obligatoria.'); ok = false;
    } else if (!isValidPassword(data.password)) {
      setFieldError('reg-password', 'Minimo 8 caracteres.'); ok = false;
    } else { setFieldOk('reg-password'); }

    // Confirm password validation
    if (!data.password2) {
      setFieldError('reg-password2', 'Confirma tu contrasena.'); ok = false;
    } else if (data.password !== data.password2) {
      setFieldError('reg-password2', 'Las contrasenas no coinciden.'); ok = false;
    } else { setFieldOk('reg-password2'); }

    // Terms checkbox validation
    if (!data.terms) {
      const termsWrap = document.getElementById('reg-terms')?.closest('.form__check');
      let hint = termsWrap?.querySelector('.form__field-hint');
      if (termsWrap && !hint) {
        hint = document.createElement('p');
        hint.className = 'form__field-hint';
        termsWrap.appendChild(hint);
      }
      if (hint) { hint.textContent = 'Debes aceptar los terminos y condiciones.'; hint.style.display = 'block'; }
      ok = false;
    } else {
      const hint = document.getElementById('reg-terms')?.closest('.form__check')?.querySelector('.form__field-hint');
      if (hint) hint.style.display = 'none';
    }

    return ok;
  }

  /* Handles form submission - validates and registers user
     @returns {Promise<void>}
     @description - Calls authService to create user, then inserts profile in DB */
  async function handleSubmit() {
    // Stop if validation fails
    if (!validate()) return;

    const data = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      // Disable button and show loading state
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
      }

      // Step 1: Create auth user in Supabase
      const user = await registerUserAuth(
        data.email,
        data.password,
        data.name,
        data.lastname
      );

      // Verify we got a user ID back
      if (!user?.id) {
        throw new Error('No se pudo obtener el ID del usuario.');
      }

      // Step 2: Insert user profile in database
      await insertUserProfile(user.id, data);

      // Show success message and redirect to login
      App.showToast('Cuenta creada correctamente!');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1800);

    } catch (err) {
      console.error('Error en registro:', err);

      // Map common Supabase errors to user-friendly messages
      const mensajes = {
        'User already registered': 'Este correo ya esta registrado.',
        'email rate limit exceeded': 'Demasiados intentos. Espera un momento.',
        'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
      };

      // Show error toast, restore button
      const msg = mensajes[err.message] || err.message;
      App.showToast('Error: ' + msg);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
      }
    }
  }

  /* Initializes event listeners for form fields
     @returns {void}
     @description - Attaches blur and input listeners for validation */
  function init() {
    // Attach listeners to all text inputs
    ['reg-name', 'reg-lastname', 'reg-email', 'reg-password', 'reg-password2']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // Validate on blur (when user leaves field)
        el.addEventListener('blur', () => validateField(id));
        // Re-validate on input if field has error
        el.addEventListener('input', () => {
          if (el.classList.contains('input--error')) {
            validateField(id);
          }
        });
      });

    // Handle terms checkbox change
    document.getElementById('reg-terms')
      ?.addEventListener('change', () => {
        const hint = document.getElementById('reg-terms')
          ?.closest('.form__check')
          ?.querySelector('.form__field-hint');

        if (hint) hint.style.display = 'none';
      });

    // Attach submit button click handler
    document
      .querySelector('.auth__btn-submit')
      ?.addEventListener('click', handleSubmit);
  }

  // Public API - expose init function externally
  return { init };
})();

/* ═══════════════════════════════════════
   INITIALIZATION - Set up registration on page load
   ═══════════════════════════════════════
   @description - Initializes Register module when DOM is ready
   */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reg-name')) Register.init();
});

// Expose globally for inline onclick handlers
window.togglePassword = togglePassword;
window.Register         = Register;