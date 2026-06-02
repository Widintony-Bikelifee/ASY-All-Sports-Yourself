


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




function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}


function isValidPassword(pass) {
  return pass.length >= 8;
}

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

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.classList.add('is-invalid');
  input.classList.remove('is-valid', 'input--error', 'input--ok');

  const feedback = getInvalidFeedback(input);
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.add('d-block');
  }
}

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


const Register = (() => {

  
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

    
    const termsInput = document.getElementById('reg-terms');
    const termsWrap = termsInput?.closest('.form__check');
    let termsFeedback = termsWrap?.querySelector('.invalid-feedback');

    if (!data.terms) {
      if (!termsFeedback && termsWrap) {
        termsFeedback = document.createElement('div');
        termsFeedback.className = 'invalid-feedback d-block';
        termsWrap.appendChild(termsFeedback);
      }
      if (termsFeedback) {
        termsFeedback.textContent = 'Debes aceptar los terminos y condiciones.';
      }
      termsInput?.classList.add('is-invalid');
      ok = false;
    } else {
      termsInput?.classList.remove('is-invalid');
      if (termsFeedback) {
        termsFeedback.textContent = '';
        termsFeedback.classList.remove('d-block');
      }
    }

    return ok;
  }

  
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
        const termsInput = document.getElementById('reg-terms');
        termsInput.classList.remove('is-invalid');
        const feedback = termsInput
          ?.closest('.form__check')
          ?.querySelector('.invalid-feedback');

        if (feedback) {
          feedback.textContent = '';
          feedback.classList.remove('d-block');
        }
      });

    
    document
      .querySelector('.auth__btn-submit')
      ?.addEventListener('click', handleSubmit);
  }

  
  return { init, handleSubmit };
})();


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reg-cedula')) Register.init();
});


window.togglePassword = togglePassword;
window.Register         = Register;