
    (function() {
      
      const urlParams = new URLSearchParams(window.location.search);
      let reservationId = urlParams.get('reservationId');
      
      let currentReservationData = null;
      let currentAdminCourtsIds = [];
      
      
      const toastEl = document.getElementById('toast-notification');
      let bsToast;
      if (toastEl) bsToast = new bootstrap.Toast(toastEl, { delay: 3500, autohide: true });
      
      
    (function() {
      
      const urlParams = new URLSearchParams(window.location.search);
      let reservationId = urlParams.get('reservationId');
      
      let currentReservationData = null;
      let currentAdminCourtsIds = [];
      
      
      const toastEl = document.getElementById('toast-notification');
      let bsToast;
      if (toastEl) bsToast = new bootstrap.Toast(toastEl, { delay: 3500, autohide: true });
      
      /**
       * Show message.
       * Mostrar message.
       */
      function showMessage(message, isError = false) {
        if (!bsToast) return;
        const toastBodySpan = document.querySelector('#toast-notification .toast-body span');
        const toastIcon = document.querySelector('#toast-notification .toast-body i');
        if (toastBodySpan) toastBodySpan.innerText = message;
        if (toastIcon) {
          toastIcon.className = isError ? 'bi bi-exclamation-triangle-fill me-2' : 'bi bi-check-circle-fill me-2';
        }
        bsToast.show();
      }
      
      
      /**
       * Load reservation detail.
       * Cargar reservation detail.
       */
      async function loadReservationDetail() {
        if (!reservationId) {
          showMessage('No se especificó una reserva válida', true);
          document.getElementById('reservation-id-title').innerText = 'Reserva inválida';
          return;
        }
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
          window.location.href = '../../login.html';
          return;
        }
        
        
        let adminCourts = [];
        if (typeof window.VenuesService !== 'undefined' && typeof window.VenuesService.getMisEscenarios === 'function') {
          const result = await window.VenuesService.getMisEscenarios();
          adminCourts = result.data ?? [];
        } else {
          const { data: courtsData, error } = await window.supabaseClient
            .from('escenarios')
            .select('id, nombre, ubicacion, tipo')
            .eq('propietario_id', session.user.id);
          if (!error && courtsData) adminCourts = courtsData;
        }
        currentAdminCourtsIds = adminCourts.map(c => c.id);
        
        
        const { data: reservation, error: resError } = await window.supabaseClient
          .from('reservas')
          .select(`
            id, fecha, hora_inicio, hora_fin, estado, metodo_pago, usuario_id, escenario_id,
            escenarios (id, nombre, ubicacion, tipo, precio),
            usuarios (id, nombre, apellido, correo_electronico, telefono, avatar_url)
          `)
          .eq('id', reservationId)
          .single();
        
        if (resError || !reservation) {
          console.error(resError);
          showMessage('No se pudo cargar la reserva o no existe', true);
          document.getElementById('reservation-id-title').innerText = 'Reserva no encontrada';
          return;
        }
        
        
        if (!currentAdminCourtsIds.includes(reservation.escenario_id)) {
          showMessage('No tienes permiso para ver esta reserva', true);
          document.getElementById('reservation-id-title').innerHTML = 'Acceso denegado';
          return;
        }
        
        currentReservationData = reservation;
        
        
        document.getElementById('reservation-id-title').innerHTML = `Reserva #${String(reservation.id).slice(0, 8)}`;
        document.getElementById('detail-reservation-id').innerHTML = reservation.id;
        
        
        const formattedDate = reservation.fecha || 'Fecha sin definir';
        const formattedTime = reservation.hora_inicio ? String(reservation.hora_inicio).slice(0,5) : '';
        const formattedEndTime = reservation.hora_fin ? String(reservation.hora_fin).slice(0,5) : '';
        document.getElementById('detail-datetime').innerHTML = `${formattedDate} a las ${formattedTime}`;
        
        document.getElementById('detail-duration').innerHTML = formattedEndTime ? `Hasta las ${formattedEndTime}` : 'Duración estándar';
        const totalPrice = reservation.escenarios?.precio ? reservation.escenarios.precio : 0;
        document.getElementById('detail-amount').innerHTML = `$${totalPrice}`;
        document.getElementById('detail-payment-method').innerHTML = reservation.metodo_pago || 'No especificado';
        
        
        let statusClass = '';
        let statusText = reservation.estado;
        if (reservation.estado === 'confirmada' || reservation.estado === 'completada') statusClass = 'status-confirmed';
        else if (reservation.estado === 'pendiente') statusClass = 'status-pending';
        else if (reservation.estado === 'cancelada') statusClass = 'status-cancelled';
        else statusClass = 'bg-secondary text-white';
        document.getElementById('detail-status-badge').innerHTML = `<span class="status-badge ${statusClass}">${(statusText || 'Registrada').toUpperCase()}</span>`;
        
        
        const createdAtFormatted = reservation.fecha || new Date().toLocaleString('es-ES');
        document.getElementById('detail-created-at').innerHTML = createdAtFormatted;
        
        
        const courtData = reservation.escenarios;
        if (courtData) {
          document.getElementById('court-name').innerHTML = courtData.nombre || 'Sin nombre';
          document.getElementById('court-location').innerHTML = courtData.ubicacion || 'No especificada';
          document.getElementById('court-type').innerHTML = `Tipo: ${courtData.tipo || 'Deportiva'}`;
        }
        
        
        let profileInfo = reservation.usuarios;
        if (!profileInfo && reservation.usuario_id) {
          
          const { data: fallbackUser } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', reservation.usuario_id)
            .single();
          if (fallbackUser) {
            profileInfo = {
              full_name: `${fallbackUser.nombre || ''} ${fallbackUser.apellido || ''}`.trim(),
              email: fallbackUser.correo_electronico,
              phone: fallbackUser.telefono,
              avatar_url: fallbackUser.avatar_url,
              id: fallbackUser.id
            };
          }
        } else if (profileInfo) {
           profileInfo.full_name = `${profileInfo.nombre || ''} ${profileInfo.apellido || ''}`.trim();
           profileInfo.email = profileInfo.correo_electronico;
           profileInfo.phone = profileInfo.telefono;
        }
        
        if (profileInfo) {
          document.getElementById('client-name').innerHTML = profileInfo.full_name || profileInfo.name || 'Cliente';
          document.getElementById('client-email').innerHTML = profileInfo.email || '—';
          document.getElementById('client-phone').innerHTML = profileInfo.phone || 'No registrado';
          document.getElementById('client-since').innerHTML = '—'; 
          const avatarUrl = profileInfo.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileInfo.full_name || 'Cliente')}&background=2ecc50&color=fff`;
          const avatarImgDetail = document.getElementById('client-avatar-detail');
          if(avatarImgDetail) {
            avatarImgDetail.src = avatarUrl;
            avatarImgDetail.onerror = function() { this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileInfo.full_name || 'Cliente')}&background=2ecc50&color=fff`; };
          }
          
          const viewLink = document.getElementById('view-client-link');
          if (viewLink && profileInfo.id) {
            viewLink.href = `./look_client.html?clientId=${profileInfo.id}`;
          }
        } else {
          document.getElementById('client-name').innerHTML = 'Usuario no disponible';
        }
        
        
        buildTimeline(reservation);
        
        
        document.getElementById('sidebar-user-name').innerHTML = session.user.email?.split('@')[0] || 'Admin';
        document.getElementById('sidebar-user-email').innerHTML = session.user.email || 'admin@asy.com';
      }
      
      /**
       * BuildTimeline.
       * Realiza.
       */
      function buildTimeline(reservation) {
        const timelineDiv = document.getElementById('timeline-container');
        if (!timelineDiv) return;
        const events = [];
        events.push({ date: new Date(), title: 'Reserva creada', description: 'El cliente realizó la solicitud.' });
        if (reservation.estado === 'confirmada' || reservation.estado === 'completada') {
          events.push({ date: new Date(), title: 'Reserva confirmada', description: 'El administrador confirmó la reserva.' });
        } else if (reservation.estado === 'cancelada') {
          events.push({ date: new Date(), title: 'Reserva cancelada', description: 'La reserva fue cancelada.' });
        }
        if (events.length === 0) events.push({ date: new Date(), title: 'Sin historial', description: 'No hay actividades adicionales.' });
        
        let html = '';
        events.forEach(ev => {
          html += `
            <div class="timeline-item">
              <div class="small text-muted">${ev.date.toLocaleString('es-ES')}</div>
              <div class="fw-semibold">${ev.title}</div>
              <div class="text-secondary small">${ev.description}</div>
            </div>
          `;
        });
        timelineDiv.innerHTML = html;
      }
      
      
      /**
       * Update reservation status.
       * Actualizar reservation status.
       */
      async function updateReservationStatus(newStatus) {
        if (!currentReservationData) return;
        if (currentReservationData.estado === newStatus) {
          showMessage(`La reserva ya está en estado ${newStatus}`, false);
          return;
        }
        if (currentReservationData.estado === 'confirmada' && newStatus === 'cancelada') {
          showMessage('Puedes cancelar una reserva confirmada', false);
        }
        if (currentReservationData.estado === 'cancelada') {
          showMessage('No se puede modificar una reserva cancelada', true);
          return;
        }
        
        const { error } = await window.supabaseClient
          .from('reservas')
          .update({ estado: newStatus })
          .eq('id', currentReservationData.id);
        
        if (error) {
          showMessage('Error al actualizar: ' + error.message, true);
          return;
        }
        
        showMessage(`Reserva ${newStatus === 'confirmada' ? 'confirmada' : 'cancelada'} correctamente`, false);
        
        await loadReservationDetail();
      }
      
      
      document.getElementById('btn-confirm-reservation')?.addEventListener('click', () => {
        if (currentReservationData && currentReservationData.estado !== 'pendiente') {
          showMessage('Solo puedes confirmar reservas en estado pendiente', true);
          return;
        }
        updateReservationStatus('confirmada');
      });
      
      document.getElementById('btn-cancel-reservation')?.addEventListener('click', () => {
        if (currentReservationData && currentReservationData.estado === 'cancelada') {
          showMessage('La reserva ya está cancelada', true);
          return;
        }
        updateReservationStatus('cancelada');
      });
      
      document.getElementById('refreshReservationBtn')?.addEventListener('click', () => {
        loadReservationDetail();
        showMessage('Datos actualizados', false);
      });
      
      
      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../../login.html';
      });
      
      
      /**
       * Initialize page scripting once DOM content is ready.
       * Inicializa el script de la página cuando el contenido DOM está listo.
       */
      document.addEventListener('DOMContentLoaded', () => {
        if (!reservationId) {
          showMessage('No se proporcionó ID de reserva, redirigiendo...', true);
          setTimeout(() => { window.location.href = './reservations_admin.html'; }, 2000);
          return;
        }
        loadReservationDetail();
      });
    })();
    
  })();
  
