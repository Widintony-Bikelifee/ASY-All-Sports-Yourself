'use strict';

/**
 * Toggle the visibility of a password field.
 * @param {string} inputId  — id <input>
 * @param {HTMLElement} eyeEl — the eye button
 */
function togglePassword(inputId, eyeEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  // SVG
  eyeEl.innerHTML = isPassword
    ? /* crossed-out eye */
      `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
         <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8
                  a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8
                  a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`
    : /* normal eye */
      `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`;
}

/* BASIC VALIDATIONS */

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Ensure that the password is at least 8 characters long.
 * @param {string} pass
 * @returns {boolean}
 */
function isValidPassword(pass) {
  return pass.length >= 8;
}

/* LOGIN */
const Login = (() => {

  /**
   * Collect the data from the login form.
   * @returns {{ email: string, password: string }}
   */
  function getFormData() {
    return {
      email:    document.getElementById('login-email')?.value.trim() || '',
      password: document.getElementById('login-password')?.value || '',
    };
  }

  /**
   * Validate the login form.
   * @returns {boolean}
   */
  function validate() {
    const { email, password } = getFormData();

    if (!email) {
      App.showToast('⚠️ Ingresa tu correo electrónico.');
      return false;
    }
    if (!isValidEmail(email)) {
      App.showToast('⚠️ El correo no tiene un formato válido.');
      return false;
    }
    if (!password) {
      App.showToast('⚠️ Ingresa tu contraseña.');
      return false;
    }
    return true;
  }

  /**
   * Handles the submission of the login form.
   */
  function handleSubmit() {
    if (!validate()) return;

    // This is where the API/backend call would go
    // For now, simulate a successful login
    App.showToast('✅ ¡Sesión iniciada correctamente!');
    setTimeout(() => App.showPage('home'), 1500);
  }

  return { handleSubmit, getFormData };
})();

/* REGISTER */
const Register = (() => {

  /**
   * Collect the information from the registration form.
   */
  function getFormData() {
    return {
      name:      document.getElementById('reg-name')?.value.trim()      || '',
      lastname:  document.getElementById('reg-lastname')?.value.trim()   || '',
      phone:     document.getElementById('reg-phone')?.value.trim()      || '',
      email:     document.getElementById('reg-email')?.value.trim()      || '',
      password:  document.getElementById('reg-password')?.value          || '',
      password2: document.getElementById('reg-password2')?.value         || '',
      terms:     document.getElementById('reg-terms')?.checked           || false,
    };
  }

  /**
   * Submit the registration form.
   * @returns {boolean}
   */
  function validate() {
    const data = getFormData();

    if (!data.name || !data.lastname) {
      App.showToast('⚠️ Ingresa tu nombre y apellido.');
      return false;
    }
    if (!data.email || !isValidEmail(data.email)) {
      App.showToast('⚠️ Ingresa un correo electrónico válido.');
      return false;
    }
    if (!isValidPassword(data.password)) {
      App.showToast('⚠️ La contraseña debe tener al menos 8 caracteres.');
      return false;
    }
    if (data.password !== data.password2) {
      App.showToast('⚠️ Las contraseñas no coinciden.');
      return false;
    }
    if (!data.terms) {
      App.showToast('⚠️ Debes aceptar los Términos y Condiciones.');
      return false;
    }
    return true;
  }

  /**
   * Handles the submission of the registration form.
   */
  function handleSubmit() {
    if (!validate()) return;

    // This is where the API/backend call would go
    App.showToast('🎉 ¡Cuenta creada! Bienvenido a All Sports Yourself.');
    setTimeout(() => App.showPage('home'), 1800);
  }

  return { handleSubmit, getFormData };
})();

/* EXPORTS GLOBALES */
window.togglePassword = togglePassword;
window.Login          = Login;
window.Register       = Register;