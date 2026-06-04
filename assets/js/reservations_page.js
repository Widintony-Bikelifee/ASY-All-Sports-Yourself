/**
 * reservations_page.js script file.
 * Archivo de script reservations_page.js.
 */
(async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = parseInt(urlParams.get('venueId'), 10);

  if (!venueId) {
    alert('⚠️ No se ha seleccionado ningún escenario.');
    window.location.href = './user/venues_user.html';
    return;
  }

  
  const todayStr = new Date().toISOString().split('T')[0];
  const reserveDateInput = document.getElementById('reserveDate');
  if (reserveDateInput) reserveDateInput.min = todayStr;

  let PRICE_PER_HOUR = 85000;
  let selectedVenue = null;

  try {
    const { data: escenarios, error } = await window.VenuesService.getEscenarios();
    if (error) throw error;

    selectedVenue = escenarios.find(e => e.id === venueId);
    if (!selectedVenue) throw new Error('Escenario no encontrado');

    PRICE_PER_HOUR = selectedVenue.precio || 85000;

    
    document.getElementById('courtNameDisplay').innerHTML = `<i class="bi bi-trophy-fill text-warning" ></i> ${selectedVenue.nombre}`;
    document.getElementById('courtLocationDisplay').textContent = selectedVenue.ubicacion || 'Ipiales';
    document.getElementById('courtPriceDisplay').innerHTML = `<i class="bi bi-cash"></i> ${_formatCOP(PRICE_PER_HOUR)} / hora`;

    if (selectedVenue.imagen_url) {
      const isExternal = selectedVenue.imagen_url.startsWith('http');
      const imgPath = isExternal ? selectedVenue.imagen_url : `../assets/img/venues/${selectedVenue.imagen_url}`;
      const imageDiv = document.getElementById('courtImageDiv');
      if (imageDiv) {
        imageDiv.style.backgroundImage = `url('${imgPath}')`;
        const placeholder = document.getElementById('placeholderText');
        if (placeholder) placeholder.classList.add('d-none');
      }
    }

    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const profile = await window.getUserProfile(session.user.id);
      if (profile) {
        document.getElementById('fullName').value = `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim();
        document.getElementById('phone').value = profile.telefono ?? '';
      }
    }

  } catch (e) {
    console.error(e);
    alert('Error cargando los detalles del espacio deportivo.');
  }

  const form = document.getElementById('reservationForm');
  const btn = document.getElementById('btnProceedPayment');
  const durationSelect = document.getElementById('durationHours');
  const dynamicTotalSpan = document.getElementById('dynamicTotalPrice');
  
  
  /**
   * Update total price.
   * Actualizar total price.
   */
  
  function updateTotalPrice() {
    const hours = parseInt(durationSelect.value, 10);
    const total = hours * PRICE_PER_HOUR;
    dynamicTotalSpan.innerHTML = _formatCOP(total);
    
    
    for (let i = 0; i < durationSelect.options.length; i++) {
      const opt = durationSelect.options[i];
      const optHours = parseInt(opt.value, 10);
      opt.textContent = `${optHours} hora${optHours > 1 ? 's' : ''} - ${_formatCOP(optHours * PRICE_PER_HOUR)}`;
    }
  }
  
  durationSelect.addEventListener('change', updateTotalPrice);
  updateTotalPrice();
  
  
  /**
   * Get end time.
   * Obtener end time.
   */
  
  function getEndTime(startTime, durationHours) {
    const timeMap = {
      '08:00 AM': 8, '09:00 AM': 9, '10:00 AM': 10, '11:00 AM': 11,
      '12:00 PM': 12, '01:00 PM': 13, '02:00 PM': 14, '03:00 PM': 15,
      '04:00 PM': 16, '05:00 PM': 17, '06:00 PM': 18, '07:00 PM': 19,
      '08:00 PM': 20, '09:00 PM': 21
    };
    
    const startHour = timeMap[startTime];
    if (!startHour) return '';
    
    const endHour = startHour + durationHours;
    const endHour12 = endHour > 12 ? endHour - 12 : endHour;
    const ampm = endHour >= 12 ? 'PM' : 'AM';
    return `${endHour12.toString().padStart(2, '0')}:00 ${ampm}`;
  }

  /**
   * Format cop.
   * Formatear cop.
   */
  
  function _formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  /**
   * ProceedToPayment. Validates reservation form inputs and redirects to the payment page with session data.
   * ProceedToPayment. Valida los campos del formulario de reserva y redirige a la página de pago con los datos en sesión.
   */
  
  function proceedToPayment(event) {
    if (event) event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const idNumber = document.getElementById('idNumber').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const reserveDate = document.getElementById('reserveDate').value;
    const reserveTime = document.getElementById('reserveTime').value;
    const durationHours = parseInt(durationSelect.value, 10);
    const commentsField = document.querySelector('textarea');
    const comments = commentsField ? commentsField.value.trim() : '';

    if (!fullName) {
      document.getElementById('fullName').classList.add('is-invalid');
      alert("⚠️ Por favor ingresa tu nombre completo.");
      return false;
    }
    document.getElementById('fullName').classList.remove('is-invalid');

    if (!idNumber || !/^\d{6,12}$/.test(idNumber)) {
      document.getElementById('idNumber').classList.add('is-invalid');
      alert("⚠️ La cédula debe contener solo números (6 a 12 dígitos).");
      return false;
    }
    document.getElementById('idNumber').classList.remove('is-invalid');

    if (!phone) {
      document.getElementById('phone').classList.add('is-invalid');
      alert("⚠️ Número de teléfono requerido.");
      return false;
    }
    document.getElementById('phone').classList.remove('is-invalid');

    if (!reserveDate) {
      alert("📅 Selecciona la fecha de la reserva.");
      return false;
    }

    if (!reserveTime) {
      alert("⏰ Elige una hora para la reserva.");
      return false;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (reserveDate < todayStr) {
      alert("❌ No se pueden reservar fechas pasadas. Elige una fecha futura.");
      return false;
    }
    
    const endTime = getEndTime(reserveTime, durationHours);
    
    if (endTime) {
      /**
       * endHour24. Resolves the end hour in 24-hour format from the computed end time string.
       * endHour24. Obtiene la hora de finalización en formato 24 horas a partir de la cadena de hora calculada.
       */
      
      const endHour24 = (() => {
        const timeMapRev = {
          '08:00 AM': 8, '09:00 AM': 9, '10:00 AM': 10, '11:00 AM': 11,
          '12:00 PM': 12, '01:00 PM': 13, '02:00 PM': 14, '03:00 PM': 15,
          '04:00 PM': 16, '05:00 PM': 17, '06:00 PM': 18, '07:00 PM': 19,
          '08:00 PM': 20, '09:00 PM': 21, '10:00 PM': 22, '11:00 PM': 23
        };
        return timeMapRev[endTime];
      })();
      
      if (endHour24 && endHour24 > 23) {
        alert("❌ La hora de finalización excede el horario de cierre (11:00 PM). Por favor elige una hora de inicio más temprana o menor duración.");
        return false;
      }
    }

    const totalPrice = durationHours * PRICE_PER_HOUR;

    
    const get24HTime = (str12h) => {
      const parts = str12h.split(' ');
      const [h, m] = parts[0].split(':').map(Number);
      const isPM = parts[1] === 'PM';
      let hour = h;
      if (isPM && h !== 12) hour += 12;
      if (!isPM && h === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    };

    const tempReservation = {
      escenario_id: venueId,
      nombre_cancha: selectedVenue ? selectedVenue.nombre : "Cancha",
      precio_hora: PRICE_PER_HOUR,
      fecha: reserveDate,
      hora_inicio: get24HTime(reserveTime),
      hora_fin: get24HTime(endTime),
      total: totalPrice,
      horas: durationHours,
      customerName: fullName,
      idNumber: idNumber,
      phone: phone,
      comments: comments
    };

    sessionStorage.setItem('tempReservation', JSON.stringify(tempReservation));
    window.location.href = 'payments_page.html';
    return true;
  }

  if (form) form.addEventListener('submit', proceedToPayment);
  if (btn) {
    btn.addEventListener('click', function(e) {
      if(form && form.checkValidity && !form.checkValidity()){
        e.preventDefault();
        form.reportValidity();
      } else {
        proceedToPayment(e);
      }
    });
  }
})();
