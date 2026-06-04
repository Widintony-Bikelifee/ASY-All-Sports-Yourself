
    (function() {
      
      const urlParams = new URLSearchParams(window.location.search);
      let clientId = urlParams.get('clientId');
      
      
      let currentClientData = null;
      let bookingsList = [];     
      let currentAdminVenuesIds = [];  
      
      const toastEl = document.getElementById('toast-notification');
      let bsToast;
      if (toastEl) bsToast = new bootstrap.Toast(toastEl, { delay: 3500, autohide: true });
      
      
    (function() {
      
      const urlParams = new URLSearchParams(window.location.search);
      let clientId = urlParams.get('clientId');
      
      
      let currentClientData = null;
      let bookingsList = [];     
      let currentAdminVenuesIds = [];  
      
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
        const toastContainer = document.querySelector('#toast-notification');
        if (isError) toastContainer.classList.add('text-bg-danger', 'bg-opacity-90');
        else toastContainer.classList.remove('text-bg-danger', 'bg-opacity-90');
        bsToast.show();
        setTimeout(() => {
          if(!isError) toastContainer.classList.remove('text-bg-danger', 'bg-opacity-90');
        }, 3000);
      }

      
      /**
       * Load client detail.
       * Cargar client detail.
       */
      async function loadClientDetail() {
        if (!clientId) {
          showMessage('No se especificó un cliente válido', true);
          document.getElementById('client-detail-name').innerText = 'Cliente inválido';
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
            .select('id, nombre')
            .eq('propietario_id', session.user.id);
          if (!error && courtsData) adminCourts = courtsData;
        }
        currentAdminVenuesIds = adminCourts.map(c => c.id);
        
        
        let clienteInfo = null;
        
        
        const { data: userData, error: userError } = await window.supabaseClient
          .from('usuarios')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (userError) {
          console.warn(userError);
          showMessage('Cliente no encontrado o no existe', true);
          document.getElementById('client-detail-name').innerHTML = 'Cliente no disponible';
          return;
        }
        clienteInfo = userData;
        clienteInfo.full_name = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
        clienteInfo.email = userData.correo_electronico;
        clienteInfo.phone = userData.telefono;
        
        currentClientData = clienteInfo;
        
        const fullName = clienteInfo.full_name || clienteInfo.name || 'Usuario deportivo';
        document.getElementById('client-detail-name').innerHTML = fullName;
        document.getElementById('profile-fullname').innerHTML = fullName;
        document.getElementById('client-detail-email').innerHTML = clienteInfo.email || '—';
        document.getElementById('contact-email').innerHTML = clienteInfo.email || '—';
        document.getElementById('contact-phone').innerHTML = clienteInfo.phone || 'No registrado';
        const memberDate = clienteInfo.created_at ? new Date(clienteInfo.created_at).toLocaleDateString('es-ES') : '—';
        document.getElementById('member-since').innerHTML = memberDate;
        const avatarUrl = clienteInfo.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff&bold=true&size=96`;
        const avatarImg = document.getElementById('clientAvatarDetail');
        if (avatarImg) {
          avatarImg.src = avatarUrl;
          avatarImg.onerror = function() { this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff&bold=true&size=96`; };
        }
        document.getElementById('sidebar-user-name').innerHTML = session.user.email?.split('@')[0] || 'Administrador';
        document.getElementById('sidebar-user-email').innerHTML = session.user.email || 'admin@asy.com';
        
        
        await loadClientBookings(clientId);
      }
      
      /**
       * Load client bookings.
       * Cargar client bookings.
       */
      async function loadClientBookings(userId) {
        
        const { data, error } = await window.VenuesService.getReservasAdmin();
        
        if (error) {
          console.error(error);
          showMessage('Error al cargar reservas', true);
          bookingsList = [];
        } else {
          
          bookingsList = (data || []).filter(r => String(r.usuario_id).trim() === String(userId).trim());
        }
        
        
        const totalBookings = bookingsList.length;
        const uniqueCourts = new Set(bookingsList.map(b => b.escenarios?.id).filter(Boolean)).size;
        let lastBookingDate = '—';
        if (bookingsList.length > 0) {
          const lastBooking = bookingsList[0];
          lastBookingDate = `${lastBooking.fecha} ${lastBooking.hora_inicio}`;
        }
        document.getElementById('stat-total-bookings').innerText = totalBookings;
        document.getElementById('stat-unique-courts').innerText = uniqueCourts;
        document.getElementById('stat-last-booking').innerHTML = lastBookingDate !== '—' ? lastBookingDate : 'Sin reservas';
        
        
        let favCourtId = null;
        let maxCount = 0;
        const courtCounter = new Map();
        bookingsList.forEach(b => {
          let courtId = b.escenarios?.id;
          if (!courtId) return;
          let count = (courtCounter.get(courtId) || 0) + 1;
          courtCounter.set(courtId, count);
          if (count > maxCount) {
            maxCount = count;
            favCourtId = courtId;
          }
        });
        let favCourtName = '—';
        if (favCourtId && bookingsList.length) {
          const foundCourt = bookingsList.find(b => b.escenarios?.id === favCourtId);
          if (foundCourt && foundCourt.escenarios && foundCourt.escenarios.nombre) favCourtName = foundCourt.escenarios.nombre;
          else favCourtName = `Cancha #${favCourtId}`;
        }
        document.getElementById('fav-court-name').innerHTML = favCourtName;
        
        
        renderBookingsTable(bookingsList);
      }
      
      /**
       * Render bookings table.
       * Renderizar bookings table.
       */
      function renderBookingsTable(bookings) {
        const tbody = document.getElementById('bookings-history-tbody');
        if (!bookings.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5"><i class="bi bi-inbox fs-3 d-block mb-2" ></i> No hay reservas registradas de este cliente en tus canchas</td></tr>`;
          return;
        }
        let html = '';
        bookings.forEach(booking => {
          const formattedDate = booking.fecha || '';
          const formattedTime = booking.hora_inicio ? String(booking.hora_inicio).slice(0,5) : '';
          const courtName = booking.escenarios?.nombre || 'Cancha sin nombre';
          const locationInfo = booking.escenarios?.ubicacion || '';
          const amount = booking.escenarios?.precio ? `$${booking.escenarios.precio}` : '—';
          let statusBadge = '';
          switch(booking.estado) {
            case 'confirmada': statusBadge = '<span class="badge bg-success">Confirmada</span>'; break;
            case 'completada': statusBadge = '<span class="badge bg-primary">Completada</span>'; break;
            case 'pendiente': statusBadge = '<span class="badge bg-warning text-dark">Pendiente</span>'; break;
            case 'cancelada': statusBadge = '<span class="badge bg-danger">Cancelada</span>'; break;
            default: statusBadge = '<span class="badge bg-secondary">Registrada</span>';
          }
          html += `<tr>
            <td class="ps-4"><small class="text-muted">${String(booking.id || '').slice(0,8)}</small></td>
            <td><strong>${formattedDate}</strong><br><small>${formattedTime}</small></td>
            <td><i class="bi bi-geo-alt me-1 text-success" ></i> ${courtName} ${locationInfo ? `<span class="text-secondary small">(${locationInfo})</span>` : ''}</td>
            <td>${amount}</td>
            <td>${statusBadge}</td>
            <td class="pe-4"><a href="./look_reservations_client.html?reservationId=${booking.id}" class="btn btn-sm btn-outline-info rounded-pill"><i class="bi bi-eye"></i> Ver</a></td>
          </tr>`;
        });
        tbody.innerHTML = html;
        
        const filterInput = document.getElementById('filter-bookings-input');
        if (filterInput) {
          const originalHandler = filterInput.oninput;
          filterInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = bookingsList.filter(b => {
              const courtVal = b.escenarios?.nombre?.toLowerCase() || '';
              const dateVal = String(b.fecha || '').toLowerCase();
              return courtVal.includes(term) || dateVal.includes(term);
            });
            renderBookingsTable(filtered);
          };
        }
      }
      
      
      document.getElementById('refreshClientBtn')?.addEventListener('click', () => {
        loadClientDetail();
        showMessage('Datos actualizados', false);
      });
      
      
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await window.supabaseClient.auth.signOut();
          window.location.href = '../../login.html';
        });
      }
      
      
      /**
       * Initialize page scripting once DOM content is ready.
       * Inicializa el script de la página cuando el contenido DOM está listo.
       */
      document.addEventListener('DOMContentLoaded', () => {
        
        if (!clientId) {
          showMessage('No se ha seleccionado ningún cliente. Redirigiendo...', true);
          setTimeout(() => { window.location.href = './clients_admin.html'; }, 2000);
          return;
        }
        loadClientDetail();
        
        if (typeof window.AuthService !== 'undefined' && window.AuthService.getCurrentUser) {
          window.AuthService.getCurrentUser().then(user => {
            if (user) {
              document.getElementById('sidebar-user-name').innerHTML = user.email?.split('@')[0] || 'Admin';
              document.getElementById('sidebar-user-email').innerHTML = user.email;
            }
          }).catch(()=>{});
        }
      });
    })();
  })();
  
