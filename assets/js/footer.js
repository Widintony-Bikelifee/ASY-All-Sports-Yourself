/* 
   footer.js - Footer logic and newsletter handler
   */
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.getElementById('footer-newsletter');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input').value;
      
      // Simulación de registro (puedes integrar con tu API aquí)
      console.log('Newsletter subscription for:', email);
      App.showToast('¡Gracias por suscribirte! Te mantendremos informado.');
      newsletterForm.reset();
    });
  }
});