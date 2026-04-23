'use strict';

/* SUPABASE */
const supabaseUrl = 'https://syiyfvfuondxuntkoumb.supabase.co';
const supabaseKey = 'sb_publishable_7mNlNfecB1RnCxLqRvprzA_jOmvwgRW';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

/* TOGGLE PASSWORD */
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

/* INLINE VALIDATION HELPERS */
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

/* LOGIN */
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
      if (!email)                    setFieldError('login-email', 'El correo es obligatorio.');
      else if (!isValidEmail(email)) setFieldError('login-email', 'Formato de correo invalido.');
      else                           setFieldOk('login-email');
    }

    if (fieldId === 'login-password') {
      if (!password) setFieldError('login-password', 'La contrasena es obligatoria.');
      else           setFieldOk('login-password');
    }
  }

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

  async function handleSubmit() {
    if (!validate()) return;

    const { email, password } = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Iniciando sesion...'; }

      // 1. Authenticate with Supabase Auth
      const { data: sessionData, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // 2. Retrieve user data from the users table
      const { data: usuario, error: dbError } = await supabaseClient
        .from('usuarios')
        .select('nombre, apellido')
        .eq('id', sessionData.user.id)
        .single();

      if (dbError) throw new Error('No se encontraron datos del usuario.');

      App.showToast('Bienvenido, ' + usuario.nombre + '!');
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);

    } catch (err) {
      console.error('Error en login:', err);

      const mensajes = {
        'Invalid login credentials': 'Correo o contrasena incorrectos.',
        'Email not confirmed':        'Debes confirmar tu correo antes de iniciar sesion.',
        'Too many requests':          'Demasiados intentos. Espera un momento.',
      };
      const msg = mensajes[err.message] || err.message;
      setFieldError('login-email', msg);

      if (btn) { btn.disabled = false; btn.textContent = 'Iniciar Sesion'; }
    }
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

/* REGISTER */
const Register = (() => {

  function getFormData() {
    return {
      name:      document.getElementById('reg-name')?.value.trim()    || '',
      lastname:  document.getElementById('reg-lastname')?.value.trim() || '',
      phone:     document.getElementById('reg-phone')?.value.trim()    || '',
      email:     document.getElementById('reg-email')?.value.trim()    || '',
      password:  document.getElementById('reg-password')?.value        || '',
      password2: document.getElementById('reg-password2')?.value       || '',
      terms:     document.getElementById('reg-terms')?.checked         || false,
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
        if (!data.email)                    setFieldError('reg-email', 'El correo es obligatorio.');
        else if (!isValidEmail(data.email)) setFieldError('reg-email', 'Formato de correo invalido.');
        else                                setFieldOk('reg-email');
        break;
      case 'reg-password':
        if (!data.password)                       setFieldError('reg-password', 'La contrasena es obligatoria.');
        else if (!isValidPassword(data.password)) setFieldError('reg-password', 'Minimo 8 caracteres.');
        else                                      setFieldOk('reg-password');
        if (data.password2) validateField('reg-password2');
        break;
      case 'reg-password2':
        if (!data.password2)                       setFieldError('reg-password2', 'Confirma tu contrasena.');
        else if (data.password !== data.password2) setFieldError('reg-password2', 'Las contrasenas no coinciden.');
        else                                       setFieldOk('reg-password2');
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
      setFieldError('reg-email', 'Formato de correo invalido.'); ok = false;
    } else { setFieldOk('reg-email'); }

    if (!data.password) {
      setFieldError('reg-password', 'La contrasena es obligatoria.'); ok = false;
    } else if (!isValidPassword(data.password)) {
      setFieldError('reg-password', 'Minimo 8 caracteres.'); ok = false;
    } else { setFieldOk('reg-password'); }

    if (!data.password2) {
      setFieldError('reg-password2', 'Confirma tu contrasena.'); ok = false;
    } else if (data.password !== data.password2) {
      setFieldError('reg-password2', 'Las contrasenas no coinciden.'); ok = false;
    } else { setFieldOk('reg-password2'); }

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

  async function handleSubmit() {
    if (!validate()) return;

    const data = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }

      // 1. Create a user in Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { nombre: data.name, apellido: data.lastname }
        }
      });

      if (authError) throw authError;

      // 2. Verify that the ID was obtained
      const userId = authData?.user?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario.');

      // 3. Store additional data in the users table
      const { error: dbError } = await supabaseClient
        .from('usuarios')
        .insert([{
          id:                 userId,
          nombre:             data.name,
          apellido:           data.lastname,
          telefono:           data.phone || null,
          correo_electronico: data.email,
        }]);

      if (dbError) throw new Error('Error al guardar perfil: ' + dbError.message);

      App.showToast('Cuenta creada correctamente! Bienvenido a All Sports Yourself.');
      setTimeout(() => { window.location.href = 'login.html'; }, 1800);

    } catch (err) {
      console.error('Error en registro:', err);

      const mensajes = {
        'User already registered':   'Este correo ya esta registrado.',
        'email rate limit exceeded': 'Demasiados intentos. Espera un momento.',
        'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
      };
      const msg = mensajes[err.message] || err.message;
      App.showToast('Error: ' + msg);

      if (btn) { btn.disabled = false; btn.textContent = 'Crear Cuenta'; }
    }
  }

  function init() {
    ['reg-name', 'reg-lastname', 'reg-email', 'reg-password', 'reg-password2'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur',  () => validateField(id));
      el.addEventListener('input', () => { if (el.classList.contains('input--error')) validateField(id); });
    });

    document.getElementById('reg-terms')?.addEventListener('change', () => {
      const hint = document.getElementById('reg-terms')?.closest('.form__check')?.querySelector('.form__field-hint');
      if (hint) hint.style.display = 'none';
    });
  }

  return { handleSubmit, init };
})();

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-email')) Login.init();
  if (document.getElementById('reg-name'))    Register.init();
});

window.togglePassword = togglePassword;
window.Login          = Login;
window.Register       = Register;