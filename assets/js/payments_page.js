
document.addEventListener('DOMContentLoaded', () => {
  const tempReservationStr = sessionStorage.getItem('tempReservation');
  
  if (!tempReservationStr) {
    alert('⚠️ No hay detalles de reserva disponibles.');
    window.location.href = './user/venues_user.html';
    return;
  }

  const tempReservation = JSON.parse(tempReservationStr);

  
  document.getElementById('summary-court').textContent = tempReservation.nombre_cancha;
  document.getElementById('summary-date').textContent = tempReservation.fecha;
  
  const fmtTime = (t24h) => {
    if (!t24h) return '';
    const [h, m] = t24h.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  document.getElementById('summary-time').textContent = `${fmtTime(tempReservation.hora_inicio)} - ${fmtTime(tempReservation.hora_fin)}`;
  document.getElementById('summary-duration').textContent = `${tempReservation.horas} hora${tempReservation.horas > 1 ? 's' : ''}`;
  document.getElementById('summary-price-hour').textContent = `${_formatCOP(tempReservation.precio_hora)} / h`;
  document.getElementById('summary-total').textContent = _formatCOP(tempReservation.total);

  
  const methodOptions = document.querySelectorAll('.payment-method-option');
  const forms = {
    tarjeta: document.getElementById('form-tarjeta-wrapper'),
    pse: document.getElementById('form-pse-wrapper'),
    efectivo: document.getElementById('form-efectivo-wrapper')
  };

  let selectedMethod = 'tarjeta';

  methodOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      methodOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      selectedMethod = opt.dataset.method;
      
      
      Object.keys(forms).forEach(key => {
        if (key === selectedMethod) {
          forms[key].classList.remove('d-none');
        } else {
          forms[key].classList.add('d-none');
        }
      });
    });
  });

  
  document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = `./reservations_page.html?venueId=${tempReservation.escenario_id}`;
  });

  
  const btnPay = document.getElementById('btn-pay-now');
  const paymentError = document.getElementById('payment-error');

  btnPay.addEventListener('click', async () => {
    paymentError.classList.add('d-none');
    
    
    if (selectedMethod === 'tarjeta') {
      const holder = document.getElementById('card-holder').value.trim();
      const number = document.getElementById('card-number').value.trim();
      const expiry = document.getElementById('card-expiry').value.trim();
      const cvc = document.getElementById('card-cvc').value.trim();

      if (!holder || !number || !expiry || !cvc) {
        paymentError.textContent = '⚠️ Por favor completa todos los campos de tu tarjeta.';
        paymentError.classList.remove('d-none');
        return;
      }
    } else if (selectedMethod === 'pse') {
      const bank = document.getElementById('pse-bank').value;
      const email = document.getElementById('pse-email').value.trim();

      if (!bank || !email) {
        paymentError.textContent = '⚠️ Por favor selecciona tu banco e introduce tu correo de PSE.';
        paymentError.classList.remove('d-none');
        return;
      }
    }

    btnPay.disabled = true;
    btnPay.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando pago...';

    
    const finalStatus = (selectedMethod === 'efectivo') ? 'pendiente' : 'confirmada';

    try {
      const { error } = await window.VenuesService.insertReserva({
        escenario_id: tempReservation.escenario_id,
        fecha: tempReservation.fecha,
        hora_inicio: tempReservation.hora_inicio,
        hora_fin: tempReservation.hora_fin,
        metodo_pago: selectedMethod
      });

      if (error) throw error;

      
      const { data: reservas, error: resError } = await window.VenuesService.getMisReservas();
      if (resError) throw resError;

      const latestRes = reservas[0];

      
      const ticketInfo = {
        reserva_id: latestRes.id,
        nombre_cancha: tempReservation.nombre_cancha,
        fecha: tempReservation.fecha,
        hora_inicio: tempReservation.hora_inicio,
        hora_fin: tempReservation.hora_fin,
        total: tempReservation.total,
        metodo_pago: selectedMethod,
        estado: finalStatus,
        customerName: tempReservation.customerName,
        idNumber: tempReservation.idNumber,
        phone: tempReservation.phone
      };

      sessionStorage.setItem('ticketInfo', JSON.stringify(ticketInfo));
      sessionStorage.removeItem('tempReservation'); 

      App.showToast('✅ Pago confirmado y reserva registrada con éxito.');
      setTimeout(() => {
        window.location.href = './facture.html';
      }, 1000);

    } catch (err) {
      console.error('Error insertando reserva:', err);
      paymentError.textContent = '❌ Error al procesar tu reserva: ' + (err.message || 'Inténtalo de nuevo.');
      paymentError.classList.remove('d-none');
      btnPay.disabled = false;
      btnPay.innerHTML = '<i class="bi bi-lock-fill me-2"></i> Confirmar y Reservar';
    }
  });

  function _formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }
});
