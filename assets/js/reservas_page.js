



/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = parseInt(urlParams.get('venueId'), 10);

  if (!venueId) {
    App.showToast('⚠️ No se ha seleccionado ningún escenario.');
    setTimeout(() => {
      window.location.href = './user/venues_user.html';
    }, 1500);
    return;
  }

  
  const dateInput = document.getElementById('res-date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  let selectedVenue = null;

  
  try {
    const { data: escenarios, error } = await window.VenuesService.getEscenarios();
    if (error) throw error;

    selectedVenue = escenarios.find(e => e.id === venueId);
    if (!selectedVenue) {
      throw new Error('Escenario deportivo no encontrado.');
    }

    
    document.getElementById('court-name').textContent = selectedVenue.nombre;
    document.getElementById('court-type').textContent = selectedVenue.tipo;
    document.getElementById('court-location').textContent = `📍 ${selectedVenue.ubicacion || 'Ipiales'}`;
    document.getElementById('court-price').textContent = _formatCOP(selectedVenue.precio);

    if (selectedVenue.imagen_url) {
      const isExternal = selectedVenue.imagen_url.startsWith('http');
      document.getElementById('court-image').src = isExternal 
        ? selectedVenue.imagen_url 
        : `../assets/img/venues/${selectedVenue.imagen_url}`;
    }

  } catch (error) {
    console.error('Error al cargar escenario:', error);
    App.showToast('❌ Error al cargar los detalles de la cancha.');
  }

  
  const startInput = document.getElementById('res-start');
  const endInput = document.getElementById('res-end');
  const calcDuration = document.getElementById('calc-duration');
  const calcTotal = document.getElementById('calc-total');

  /**
   * Recalculate. Computes the booking duration and total cost based on selected start and end times.
   * Recalculate. Calcula la duración de la reserva y el costo total según las horas de inicio y fin seleccionadas.
   */
  
  function recalculate() {
    const start = startInput.value;
    const end = endInput.value;

    if (start && end) {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

      if (diffMinutes > 0) {
        const hours = Math.round((diffMinutes / 60) * 100) / 100;
        calcDuration.textContent = `${hours} hora${hours !== 1 ? 's' : ''}`;
        
        if (selectedVenue) {
          const total = hours * selectedVenue.precio;
          calcTotal.textContent = _formatCOP(total);
        }
      } else {
        calcDuration.textContent = '0 horas';
        calcTotal.textContent = '$0 COP';
      }
    }
  }

  startInput.addEventListener('change', recalculate);
  endInput.addEventListener('change', recalculate);

  
  const form = document.getElementById('form-reservation');
  const alertError = document.getElementById('alert-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alertError.classList.add('d-none');

    const fecha = dateInput.value;
    const start = startInput.value;
    const end = endInput.value;

    if (!fecha || !start || !end) {
      alertError.textContent = 'Por favor completa todos los campos.';
      alertError.classList.remove('d-none');
      return;
    }

    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (diffMinutes <= 0) {
      alertError.textContent = 'La hora de fin debe ser posterior a la hora de inicio.';
      alertError.classList.remove('d-none');
      return;
    }

    
    const hours = Math.round((diffMinutes / 60) * 100) / 100;
    const total = hours * selectedVenue.precio;

    const tempReservation = {
      escenario_id: venueId,
      nombre_cancha: selectedVenue.nombre,
      precio_hora: selectedVenue.precio,
      fecha,
      hora_inicio: start,
      hora_fin: end,
      total,
      horas: hours
    };

    sessionStorage.setItem('tempReservation', JSON.stringify(tempReservation));

    
    window.location.href = `./payments_page.html`;
  });

  /**
   * Format cop.
   * Formatear cop.
   */
  
  function _formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }
});
