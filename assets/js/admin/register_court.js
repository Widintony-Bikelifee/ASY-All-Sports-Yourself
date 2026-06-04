

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */
document.addEventListener('DOMContentLoaded', function () {

  
  let uploadedImageUrl = '';
  let isUploading = false;
  const COMMISSION_RATE = 0.10; 

  
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
  const submitBtn       = document.getElementById('submit-btn');
  const priceInput      = document.getElementById('court-price');
  const previewPriceSpan      = document.getElementById('preview-price');
  const previewCommissionSpan = document.getElementById('preview-commission');
  const previewEarningSpan    = document.getElementById('preview-earning');

  
  /**
   * Update commission preview.
   * Actualizar commission preview.
   */
  function updateCommissionPreview() {
    const price      = parseFloat(priceInput.value) || 0;
    const commission = price * COMMISSION_RATE;
    const earning    = price - commission;

    previewPriceSpan.textContent      = `$${price.toLocaleString('es-CO')} COP`;
    previewCommissionSpan.textContent = `$${commission.toLocaleString('es-CO')} COP`;
    previewEarningSpan.textContent    = `$${earning.toLocaleString('es-CO')} COP`;
    previewEarningSpan.style.color    = earning < 0 ? '#dc3545' : 'var(--primary-green, #198754)';
  }

  priceInput.addEventListener('input', updateCommissionPreview);
  priceInput.addEventListener('input', function () {
    if (this.value < 0) this.value = 0;
  });

  
  urlInput.addEventListener('input', function () {
    const url = this.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      previewImg.src         = url;
      previewWrapper.classList.remove('d-none');
      finalImageUrl.value    = url;
      uploadedImageUrl       = '';
    } else if (url) {
      showToast('URL no válida', 'warning');
    } else {
      clearImagePreview();
    }
  });

  
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
  });

  
  /**
   * Handle file upload.
   * Manejar file upload.
   */
  async function handleFileUpload(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Formato no válido. Usa JPG, PNG, GIF o WebP', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no puede superar los 5MB', 'error');
      return;
    }

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
      reader.onload = function (e) {
        const imageUrl = e.target.result;
        previewImg.src = imageUrl;
        previewWrapper.classList.remove('d-none');
        finalImageUrl.value  = imageUrl;
        uploadedImageUrl     = imageUrl;
        uploadProgress.classList.add('d-none');
        isUploading          = false;
        submitBtn.disabled   = false;
        urlInput.value       = '';
        showToast('Imagen cargada correctamente', 'success');
      };
      reader.readAsDataURL(file);
    }, 1500);
  }

  
  /**
   * ClearImagePreview. Resets the image preview area, clearing all file and URL inputs.
   * ClearImagePreview. Restablece el área de previsualización de imagen, limpiando todos los inputs de archivo y URL.
   */
  function clearImagePreview() {
    previewWrapper.classList.add('d-none');
    previewImg.src       = '';
    finalImageUrl.value  = '';
    uploadedImageUrl     = '';
    urlInput.value       = '';
    fileInput.value      = '';
    uploadProgress.classList.add('d-none');
    progressBar.style.width = '0%';
  }

  removeBtn.addEventListener('click', clearImagePreview);

  
  /**
   * Show toast.
   * Mostrar toast.
   */
  function showToast(message, type = 'success') {
    const alertDiv   = document.getElementById('success-alert');
    const messageSpan = document.getElementById('success-message');

    
    alertDiv.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');

    messageSpan.textContent = message;

    if (type === 'error') {
      alertDiv.classList.add('alert-danger');
    } else if (type === 'warning') {
      alertDiv.classList.add('alert-warning');
    } else {
      alertDiv.classList.add('alert-success');
    }

    alertDiv.classList.remove('d-none');
    alertDiv.style.display = '';

    setTimeout(() => {
      alertDiv.classList.add('d-none');
    }, 5000);
  }

  /**
   * Validate times.
   * Validar times.
   */
  function validateTimes(openTime, closeTime) {
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    if (oh * 60 + om >= ch * 60 + cm) {
      showToast('La hora de cierre debe ser posterior a la hora de apertura', 'error');
      return false;
    }
    return true;
  }

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

  
  document.getElementById('register-court-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (isUploading) {
      showToast('Espera a que la imagen termine de cargarse', 'warning');
      return;
    }

    
    const courtName     = document.getElementById('court-name').value.trim();
    const sport         = document.getElementById('court-sport').value;
    const location      = document.getElementById('court-location').value.trim();
    const price         = document.getElementById('court-price').value;
    const openTime      = document.getElementById('open-time').value;
    const closeTime     = document.getElementById('close-time').value;
    const capacity      = document.getElementById('court-capacity').value;
    const description   = document.getElementById('court-description').value.trim();
    const termsAccepted = document.getElementById('terms-check').checked;

    
    if (!courtName)  { showToast('Ingresa el nombre de la cancha', 'error');    return; }
    if (!sport)      { showToast('Selecciona el tipo de deporte', 'error');      return; }
    if (!location)   { showToast('Ingresa la ubicación de la cancha', 'error'); return; }
    if (!price || parseFloat(price) <= 0) {
      showToast('Ingresa un precio válido mayor a 0', 'error');
      return;
    }
    if (!validateTimes(openTime, closeTime)) return;
    if (!termsAccepted) { showToast('Debes aceptar los términos y condiciones', 'error'); return; }

    
    const usuario = await window.VenuesService.getUsuarioActual();
    if (!usuario) {
      showToast('Debes iniciar sesión para registrar una cancha', 'error');
      setTimeout(() => { window.location.href = '../login.html'; }, 2000);
      return;
    }

    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';

    
    const features = getSelectedFeatures();
    const courtData = {
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

    console.log('[register_court] Payload a insertar:', courtData);

    
    const { data, error } = await window.VenuesService.insertEscenario(courtData);

    if (error) {
      console.error('[register_court] Error Supabase:', error);
      showToast('Error al registrar: ' + (error.message || JSON.stringify(error)), 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2" ></i>Registrar Cancha';
      return;
    }

    console.log('[register_court] Cancha registrada:', data);
    showToast(`¡Cancha "${courtName}" registrada exitosamente!`, 'success');

    setTimeout(() => {
      window.location.href = './courts_admin.html';
    }, 2000);
  });

  
  updateCommissionPreview();

}); 
