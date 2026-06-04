/**
 * edit_courts.js script file.
 * Archivo de script edit_courts.js.
 */
document.addEventListener('DOMContentLoaded', function () {

  
  let isUploading = false;
  let courtId     = null;
  const COMMISSION_RATE = 0.10;

  
  const submitBtn       = document.getElementById('submit-btn');
  const priceInput      = document.getElementById('court-price');
  const dropZone        = document.getElementById('drop-zone');
  const fileInput       = document.getElementById('file-input');
  const uploadProgress  = document.getElementById('upload-progress');
  const progressBar     = document.getElementById('progress-bar');
  const progressText    = document.getElementById('progress-text');
  const previewWrapper  = document.getElementById('image-preview-wrapper');
  const previewImg      = document.getElementById('preview-img');
  const removeBtn       = document.getElementById('remove-image');
  const finalImageUrl   = document.getElementById('final-image-url');
  const urlInput        = document.getElementById('court-image-url');
  const currentImgWrap  = document.getElementById('current-image-wrapper');
  const currentImg      = document.getElementById('current-image');

  
  const urlParams = new URLSearchParams(window.location.search);
  courtId = urlParams.get('id');

  if (!courtId) {
    showAlert('No se encontró el ID de la cancha. Vuelve a la lista.', 'error');
    submitBtn.disabled = true;
  } else {
    document.getElementById('court-id').value       = courtId;
    document.getElementById('court-id-display').textContent = 'ID: ' + courtId;
    loadCourtData(courtId);
  }

  
  /**
   * Load court data.
   * Cargar court data.
   */
  async function loadCourtData(id) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';

    try {
      const { data, error } = await window.supabaseClient
        .from('escenarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        showAlert('No se pudo cargar la cancha: ' + (error?.message || 'No encontrada'), 'error');
        return;
      }

      
      document.getElementById('court-name').value     = data.nombre     || '';
      document.getElementById('court-sport').value    = data.tipo       || '';
      document.getElementById('court-location').value = data.ubicacion  || '';
      document.getElementById('court-price').value    = data.precio     || 0;
      document.getElementById('open-time').value      = data.hora_apertura ? data.hora_apertura.slice(0, 5) : '08:00';
      document.getElementById('close-time').value     = data.hora_cierre   ? data.hora_cierre.slice(0, 5)   : '22:00';
      document.getElementById('court-capacity').value = data.capacidad  || 10;
      document.getElementById('court-description').value = data.descripcion || '';

      
      if (data.imagen_url) {
        currentImgWrap.classList.remove('d-none');
        currentImg.src        = data.imagen_url;
        finalImageUrl.value   = data.imagen_url; 
      }

      
      const featureIds = {
        'Iluminación':    'feature-lights',
        'Parqueadero':    'feature-parking',
        'Vestidores':     'feature-locker',
        'WiFi':           'feature-wifi',
        'Snack Bar':      'feature-snack',
        'Alquiler Equipo':'feature-equipment',
      };
      if (Array.isArray(data.caracteristicas)) {
        data.caracteristicas.forEach(f => {
          const cbId = featureIds[f];
          if (cbId) {
            const cb = document.getElementById(cbId);
            if (cb) cb.checked = true;
          }
        });
      }

      
      updateCommissionPreview();

    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2" ></i>Guardar Cambios';
    }
  }

  
  /**
   * Update commission preview.
   * Actualizar commission preview.
   */
  function updateCommissionPreview() {
    const price      = parseFloat(priceInput.value) || 0;
    const commission = price * COMMISSION_RATE;
    const earning    = price - commission;
    document.getElementById('preview-price').textContent      = `$${price.toLocaleString('es-CO')} COP`;
    document.getElementById('preview-commission').textContent = `$${commission.toLocaleString('es-CO')} COP`;
    document.getElementById('preview-earning').textContent    = `$${earning.toLocaleString('es-CO')} COP`;
  }

  priceInput.addEventListener('input', updateCommissionPreview);
  priceInput.addEventListener('input', () => { if (priceInput.value < 0) priceInput.value = 0; });

  
  urlInput.addEventListener('input', function () {
    const url = this.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      previewImg.src = url;
      previewWrapper.classList.remove('d-none');
      finalImageUrl.value = url;
    } else if (url) {
      showAlert('URL no válida', 'warning');
    } else {
      clearNewImagePreview();
    }
  });

  
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
  });

  /**
   * Handle file upload.
   * Manejar file upload.
   */
  async function handleFileUpload(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { showAlert('Formato no válido. Usa JPG, PNG, GIF o WebP', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { showAlert('La imagen no puede superar los 5MB', 'error'); return; }

    isUploading = true;
    submitBtn.disabled = true;
    uploadProgress.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressText.textContent = 'Preparando...';

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = progress + '%';
      progressText.textContent = `Subiendo... ${progress}%`;
      if (progress >= 100) clearInterval(interval);
    }, 200);

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = function (ev) {
        previewImg.src      = ev.target.result;
        previewWrapper.classList.remove('d-none');
        finalImageUrl.value = ev.target.result;
        uploadProgress.classList.add('d-none');
        isUploading         = false;
        submitBtn.disabled  = false;
        urlInput.value      = '';
        showAlert('Imagen cargada correctamente', 'success');
      };
      reader.readAsDataURL(file);
    }, 1500);
  }

  /**
   * ClearNewImagePreview. Resets the image preview area and restores the existing court image URL.
   * ClearNewImagePreview. Restablece el área de previsualización de imagen y restaura la URL de imagen actual de la cancha.
   */
  function clearNewImagePreview() {
    previewWrapper.classList.add('d-none');
    previewImg.src      = '';
    urlInput.value      = '';
    fileInput.value     = '';
    uploadProgress.classList.add('d-none');
    progressBar.style.width = '0%';
    
    finalImageUrl.value = currentImg.src || '';
  }

  removeBtn.addEventListener('click', clearNewImagePreview);

  
  /**
   * Get selected features.
   * Obtener selected features.
   */
  function getSelectedFeatures() {
    const ids = ['feature-lights','feature-parking','feature-locker','feature-wifi','feature-snack','feature-equipment'];
    return ids
      .map(id => document.getElementById(id))
      .filter(cb => cb && cb.checked)
      .map(cb => cb.value);
  }

  
  /**
   * Show alert.
   * Mostrar alert.
   */
  function showAlert(message, type = 'success') {
    
    document.getElementById('success-alert').classList.add('d-none');
    document.getElementById('error-alert').classList.add('d-none');

    if (type === 'error') {
      document.getElementById('error-message').textContent = message;
      document.getElementById('error-alert').classList.remove('d-none');
      setTimeout(() => document.getElementById('error-alert').classList.add('d-none'), 5000);
    } else if (type === 'warning') {
      
      document.getElementById('error-message').textContent = '⚠️ ' + message;
      document.getElementById('error-alert').classList.remove('d-none');
      setTimeout(() => document.getElementById('error-alert').classList.add('d-none'), 4000);
    } else {
      document.getElementById('success-message').textContent = message;
      document.getElementById('success-alert').classList.remove('d-none');
      setTimeout(() => document.getElementById('success-alert').classList.add('d-none'), 5000);
    }
  }

  /**
   * Validate times.
   * Validar times.
   */
  function validateTimes(openTime, closeTime) {
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    if (oh * 60 + om >= ch * 60 + cm) {
      showAlert('La hora de cierre debe ser posterior a la hora de apertura', 'error');
      return false;
    }
    return true;
  }

  
  document.getElementById('edit-court-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!courtId) { showAlert('ID de cancha no encontrado', 'error'); return; }
    if (isUploading) { showAlert('Espera a que la imagen termine de cargarse', 'warning'); return; }

    
    const courtName   = document.getElementById('court-name').value.trim();
    const sport       = document.getElementById('court-sport').value;
    const location    = document.getElementById('court-location').value.trim();
    const price       = document.getElementById('court-price').value;
    const openTime    = document.getElementById('open-time').value;
    const closeTime   = document.getElementById('close-time').value;
    const capacity    = document.getElementById('court-capacity').value;
    const description = document.getElementById('court-description').value.trim();

    
    if (!courtName)  { showAlert('Ingresa el nombre de la cancha', 'error');    return; }
    if (!sport)      { showAlert('Selecciona el tipo de deporte', 'error');      return; }
    if (!location)   { showAlert('Ingresa la ubicación de la cancha', 'error'); return; }
    if (!price || parseFloat(price) <= 0) { showAlert('Ingresa un precio válido mayor a 0', 'error'); return; }
    if (!validateTimes(openTime, closeTime)) return;

    
    const usuario = await window.VenuesService.getUsuarioActual();
    if (!usuario) {
      showAlert('Debes iniciar sesión para editar una cancha', 'error');
      setTimeout(() => { window.location.href = '../login.html'; }, 2000);
      return;
    }

    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    
    const features = getSelectedFeatures();
    const updates = {
      nombre:          courtName,
      tipo:            sport,
      ubicacion:       location,
      precio:          parseInt(price),
      imagen_url:      finalImageUrl.value || null,
      hora_apertura:   openTime   || null,
      hora_cierre:     closeTime  || null,
      capacidad:       capacity ? parseInt(capacity) : null,
      caracteristicas: features.length > 0 ? features : null,
      descripcion:     description || null,
    };

    console.log('[edit_courts] Actualizando ID:', courtId, updates);

    const { data, error } = await window.VenuesService.updateEscenario(courtId, updates);

    if (error) {
      console.error('[edit_courts] Error Supabase:', error);
      showAlert('Error al guardar: ' + (error.message || JSON.stringify(error)), 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2" ></i>Guardar Cambios';
      return;
    }

    console.log('[edit_courts] Cancha actualizada:', data);
    showAlert(`¡Cancha "${courtName}" actualizada exitosamente!`, 'success');

    setTimeout(() => {
      window.location.href = './courts_admin.html';
    }, 2000);
  });

}); 
