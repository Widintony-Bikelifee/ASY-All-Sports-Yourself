



/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.getElementById('footer-newsletter');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input').value;
      
      
      console.log('Newsletter subscription for:', email);
      App.showToast('¡Gracias por suscribirte! Te mantendremos informado.');
      newsletterForm.reset();
    });
  }
});
