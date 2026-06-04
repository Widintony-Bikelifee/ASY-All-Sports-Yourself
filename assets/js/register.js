











/**
 * Toggle password.
 * Alternar password.
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
 * IsValidEmail. Validates that a string matches a basic email format.
 * IsValidEmail. Valida que una cadena coincida con el formato básico de un correo electrónico.
 */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}


/**
 * IsValidPassword. Checks that a password meets the minimum length requirement of 8 characters.
 * IsValidPassword. Verifica que una contraseña cumpla el requisito mínimo de 8 caracteres.
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
 * Register module with page helpers and application logic.
 * Registrar module with page helpers and application logic.
 */

const Register = (() => {

  
  /**
   * Get form data.
   * Obtener form data.
   */
  
  function getFormData() {
    return {
      cedula: document.getElementById('reg-cedula')?.value.trim() || '',
      name: document.getElementById('reg-name')?.value.trim() || '',
      lastname: document.getElementById('reg-lastname')?.value.trim() || '',
      phone: document.getElementById('reg-phone')?.value.trim() || '',
      email: document.getElementById('reg-email')?.value.trim() || '',
      password: document.getElementById('reg-password')?.value || '',
      password2: document.getElementById('reg-password2')?.value || '',
      terms: document.getElementById('reg-terms')?.checked || false,
      rol: document.querySelector('input[name="rol"]:checked')?.value || 'user',
    };
  }

  
  /**
   * Validate field.
   * Validar field.
   */
  
  function validateField(fieldId) {
    const data = getFormData();

    switch (fieldId) {
      case 'reg-cedula':
        if (!data.cedula) setFieldError('reg-cedula', 'La cédula es obligatoria.');
        else if (!/^\d{8,10}$/.test(data.cedula)) setFieldError('reg-cedula', 'La cédula debe tener entre 8 y 10 dígitos.');
        else setFieldOk('reg-cedula');
        break;
      case 'reg-name':
        
        if (!data.name) setFieldError('reg-name', 'El nombre es obligatorio.');
        else setFieldOk('reg-name');
        break;
      case 'reg-lastname':
        
        if (!data.lastname) setFieldError('reg-lastname', 'El apellido es obligatorio.');
        else setFieldOk('reg-lastname');
        break;
      case 'reg-email':
        
        if (!data.email) setFieldError('reg-email', 'El correo es obligatorio.');
        else if (!isValidEmail(data.email)) setFieldError('reg-email', 'Formato de correo invalido.');
        else setFieldOk('reg-email');
        break;
      case 'reg-password':
        
        if (!data.password) setFieldError('reg-password', 'La contrasena es obligatoria.');
        else if (!isValidPassword(data.password)) setFieldError('reg-password', 'Minimo 8 caracteres.');
        else setFieldOk('reg-password');
        
        if (data.password2) validateField('reg-password2');
        break;
      case 'reg-password2':
        
        if (!data.password2) setFieldError('reg-password2', 'Confirma tu contrasena.');
        else if (data.password !== data.password2) setFieldError('reg-password2', 'Las contrasenas no coinciden.');
        else setFieldOk('reg-password2');
        break;
    }
  }

  
  /**
   * Validate.
   * Validar.
   */
  
  function validate() {
    const data = getFormData();
    let ok = true;

    
    if (!data.cedula) {
      setFieldError('reg-cedula', 'La cédula es obligatoria.'); ok = false;
    } else if (!/^\d{8,10}$/.test(data.cedula)) {
      setFieldError('reg-cedula', 'La cédula debe tener entre 8 y 10 dígitos.'); ok = false;
    } else { setFieldOk('reg-cedula'); }

    
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
      setFieldError('reg-terms', 'Debes aceptar los terminos y condiciones.');
      ok = false;
    } else {
      setFieldOk('reg-terms');
    }

    return ok;
  }

  
  /**
   * Handle submit.
   * Manejar submit.
   */
  
  async function handleSubmit() {
    
    if (!validate()) return;

    const data = getFormData();
    const btn = document.querySelector('.auth__btn-submit');

    try {
      
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
      }

      
      const user = await registerUserAuth(
        data.email,
        data.password,
        data.name,
        data.lastname,
        data.cedula
      );

      
      if (!user?.id) {
        throw new Error('No se pudo obtener el ID del usuario.');
      }

      
      await insertUserProfile(user.id, data);

      
      App.showToast('Cuenta creada correctamente!');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1800);

    } catch (err) {
      console.error('Error en registro:', err);

      
      const mensajes = {
        'User already registered': 'Este correo ya esta registrado.',
        'email rate limit exceeded': 'Demasiados intentos. Espera un momento.',
        'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
      };

      
      const msg = mensajes[err.message] || err.message;
      App.showToast('Error: ' + msg);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
      }
    }
  }

  
  /**
   * Init. Attaches blur and input validation listeners to each registration field and the submit button.
   * Inicializa. Adjunta los listeners de validación de blur e input a cada campo del formulario de registro y al botón de envío.
   */
  
  function init() {
    
    ['reg-cedula', 'reg-name', 'reg-lastname', 'reg-email', 'reg-password', 'reg-password2']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        
        el.addEventListener('blur', () => validateField(id));
        
        el.addEventListener('input', () => {
          if (el.classList.contains('is-invalid')) {
            validateField(id);
          }
        });
      });

    
    document.getElementById('reg-terms')
      ?.addEventListener('change', () => {
        setFieldOk('reg-terms');
      });

    
    document
      .querySelector('.auth__btn-submit')
      ?.addEventListener('click', handleSubmit);
  }

  
  return { init, handleSubmit };
})();


/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reg-cedula')) Register.init();
});


window.togglePassword = togglePassword;
window.Register         = Register;
