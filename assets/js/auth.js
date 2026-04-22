'use strict';

/* ─────────────────────────────────────────
   TOGGLE PASSWORD
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   HELPERS DE VALIDACIÓN INLINE
───────────────────────────────────────── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(pass) {
  return pass.length >= 8;
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.classList.add('input--error');
  input.classList.remove('input--ok');

  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  let hint = wrap.querySelector('.form__field-hint');
  if (!hint) {
    hint = document.createElement('p');
    hint.className = 'form__field-hint';
    wrap.appendChild(hint);
  }
  hint.textContent = message;
  hint.style.display = 'block';
}

function setFieldOk(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.classList.remove('input--error');
  input.classList.add('input--ok');

  const wrap = input.closest('.form__input-wrap') || input.parentElement;
  const hint = wrap.querySelector('.form__field-hint');
  if (hint) hint.style.display = 'none';
}

/* ─────────────────────────────────────────
   LOGIN
───────────────────────────────────────── */
const Login = (() => {

  function getFormData() {
    return {
      email:    document.getElementById('login-email')?.value.trim() || '',
      password: document.getElementById('login-password')?.value || '',
    };
  }

  function validateField(fieldId) {
    const { email, password } = getFormData();

    if (fieldId === 'login-email') {
      if (!email)                  setFieldError('login-email', 'El correo es obligatorio.');
      else if (!isValidEmail(email)) setFieldError('login-email', 'Formato de correo inválido.');
      else                           setFieldOk('login-email');
    }

    if (fieldId === 'login-password') {
      if (!password) setFieldError('login-password', 'La contraseña es obligatoria.');
      else           setFieldOk('login-password');
    }
  }

  function validate() {
    const { email, password } = getFormData();
    let ok = true;

    if (!email) {
      setFieldError('login-email', 'El correo es obligatorio.'); ok = false;
    } else if (!isValidEmail(email)) {
      setFieldError('login-email', 'Formato de correo inválido.'); ok = false;
    } else {
      setFieldOk('login-email');
    }

    if (!password) {
      setFieldError('login-password', 'La contraseña es obligatoria.'); ok = false;
    } else {
      setFieldOk('login-password');
    }

    return ok;
  }

  function handleSubmit() {
    if (!validate()) return;
    App.showToast('✅ ¡Sesión iniciada correctamente!');
    setTimeout(() => App.showPage('home'), 1500);
  }

  function init() {
    ['login-email', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur',  () => validateField(id));
      el.addEventListener('input', () => { if (el.classList.contains('input--error')) validateField(id); });
    });
  }

  return { handleSubmit, init };
})();

/* ─────────────────────────────────────────
   REGISTER
───────────────────────────────────────── */
const Register = (() => {

  function getFormData() {
    return {
      name:      document.getElementById('reg-name')?.value.trim()      || '',
      lastname:  document.getElementById('reg-lastname')?.value.trim()   || '',
      email:     document.getElementById('reg-email')?.value.trim()      || '',
      password:  document.getElementById('reg-password')?.value          || '',
      password2: document.getElementById('reg-password2')?.value         || '',
      terms:     document.getElementById('reg-terms')?.checked           || false,
    };
  }

  function validateField(fieldId) {
    const data = getFormData();

    switch (fieldId) {
      case 'reg-name':
        if (!data.name) setFieldError('reg-name', 'El nombre es obligatorio.');
        else            setFieldOk('reg-name');
        break;
      case 'reg-lastname':
        if (!data.lastname) setFieldError('reg-lastname', 'El apellido es obligatorio.');
        else                setFieldOk('reg-lastname');
        break;
      case 'reg-email':
        if (!data.email)               setFieldError('reg-email', 'El correo es obligatorio.');
        else if (!isValidEmail(data.email)) setFieldError('reg-email', 'Formato de correo inválido.');
        else                           setFieldOk('reg-email');
        break;
      case 'reg-password':
        if (!data.password)                  setFieldError('reg-password', 'La contraseña es obligatoria.');
        else if (!isValidPassword(data.password)) setFieldError('reg-password', 'Mínimo 8 caracteres.');
        else                                 setFieldOk('reg-password');
        if (data.password2) validateField('reg-password2');
        break;
      case 'reg-password2':
        if (!data.password2)                    setFieldError('reg-password2', 'Confirma tu contraseña.');
        else if (data.password !== data.password2) setFieldError('reg-password2', 'Las contraseñas no coinciden.');
        else                                    setFieldOk('reg-password2');
        break;
    }
  }

  function validate() {
    const data = getFormData();
    let ok = true;

    if (!data.name) {
      setFieldError('reg-name', 'El nombre es obligatorio.'); ok = false;
    } else { setFieldOk('reg-name'); }

    if (!data.lastname) {
      setFieldError('reg-lastname', 'El apellido es obligatorio.'); ok = false;
    } else { setFieldOk('reg-lastname'); }

    if (!data.email) {
      setFieldError('reg-email', 'El correo es obligatorio.'); ok = false;
    } else if (!isValidEmail(data.email)) {
      setFieldError('reg-email', 'Formato de correo inválido.'); ok = false;
    } else { setFieldOk('reg-email'); }

    if (!data.password) {
      setFieldError('reg-password', 'La contraseña es obligatoria.'); ok = false;
    } else if (!isValidPassword(data.password)) {
      setFieldError('reg-password', 'Mínimo 8 caracteres.'); ok = false;
    } else { setFieldOk('reg-password'); }

    if (!data.password2) {
      setFieldError('reg-password2', 'Confirma tu contraseña.'); ok = false;
    } else if (data.password !== data.password2) {
      setFieldError('reg-password2', 'Las contraseñas no coinciden.'); ok = false;
    } else { setFieldOk('reg-password2'); }

    if (!data.terms) {
      // El checkbox no tiene wrap — mostrar hint al lado del label
      const termsWrap = document.getElementById('reg-terms')?.closest('.form__check');
      let hint = termsWrap?.querySelector('.form__field-hint');
      if (termsWrap && !hint) {
        hint = document.createElement('p');
        hint.className = 'form__field-hint';
        termsWrap.appendChild(hint);
      }
      if (hint) { hint.textContent = 'Debes aceptar los términos y condiciones.'; hint.style.display = 'block'; }
      ok = false;
    } else {
      const hint = document.getElementById('reg-terms')?.closest('.form__check')?.querySelector('.form__field-hint');
      if (hint) hint.style.display = 'none';
    }

    return ok;
  }

  function handleSubmit() {
    if (!validate()) return;
    App.showToast('🎉 ¡Cuenta creada! Bienvenido a All Sports Yourself.');
    setTimeout(() => App.showPage('home'), 1800);
  }

  function init() {
    ['reg-name', 'reg-lastname', 'reg-email', 'reg-password', 'reg-password2'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur',  () => validateField(id));
      el.addEventListener('input', () => { if (el.classList.contains('input--error')) validateField(id); });
    });

    // Checkbox
    document.getElementById('reg-terms')?.addEventListener('change', () => {
      const hint = document.getElementById('reg-terms')?.closest('.form__check')?.querySelector('.form__field-hint');
      if (hint) hint.style.display = 'none';
    });
  }

  return { handleSubmit, init };
})();

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-email')) Login.init();
  if (document.getElementById('reg-name'))    Register.init();
});

window.togglePassword = togglePassword;
window.Login          = Login;
window.Register       = Register;
