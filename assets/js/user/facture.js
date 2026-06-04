

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */
document.addEventListener('DOMContentLoaded', () => {
  const ticketInfoStr = sessionStorage.getItem('ticketInfo');

  if (!ticketInfoStr) {
    alert('⚠️ No hay detalles de reserva para facturar.');
    window.location.href = './user/venues_user.html';
    return;
  }

  const ticketInfo = JSON.parse(ticketInfoStr);

  
  const randomInvoiceNum = 'ASY-' + Math.floor(100000 + Math.random() * 900000);
  const emissionDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentLabels = {
    tarjeta: '💳 Tarjeta de Crédito / Débito',
    pse: '🏦 Transferencia PSE',
    efectivo: '💵 Pago en Efectivo (en cancha)'
  };

  const statusLabel = ticketInfo.estado === 'confirmada' 
    ? '<span class="badge bg-success">PAGADO / CONFIRMADO</span>'
    : '<span class="badge bg-warning text-dark">PENDIENTE DE PAGO</span>';

  
  document.getElementById('invoiceNumber').textContent = randomInvoiceNum;
  document.getElementById('emissionDate').textContent = emissionDate;
  
  document.getElementById('clientName').textContent = ticketInfo.customerName || 'Cliente All Sports Yourself';
  document.getElementById('clientId').textContent = ticketInfo.idNumber || '-----';
  document.getElementById('clientPhone').textContent = ticketInfo.phone || '-----';
  
  document.getElementById('paymentMethod').textContent = paymentLabels[ticketInfo.metodo_pago] || ticketInfo.metodo_pago;
  
  
  document.getElementById('detailCourt').textContent = ticketInfo.nombre_cancha;
  document.getElementById('detailDate').textContent = _formatDate(ticketInfo.fecha);
  
  const fmtTime = (t24h) => {
    if (!t24h) return '';
    const [h, m] = t24h.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  document.getElementById('detailTime').textContent = `${fmtTime(ticketInfo.hora_inicio)} - ${fmtTime(ticketInfo.hora_fin)}`;
  document.getElementById('detailReservationId').textContent = ticketInfo.reserva_id;
  
  const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  document.getElementById('detailTransactionId').textContent = transactionId;
  
  
  const statusTd = document.getElementById('detailReservationId').closest('tbody').lastElementChild.lastElementChild;
  if (statusTd) {
    statusTd.innerHTML = statusLabel;
  }

  
  document.getElementById('totalAmount').textContent = _formatCOP(ticketInfo.total);

  
  const homeBtn = document.querySelector('.btn-home');
  if (homeBtn) {
    homeBtn.href = './user/venues_user.html';
  }

  
  const downloadBtn = document.getElementById('downloadPdfBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const element = document.getElementById('invoiceContent');
      const opt = {
        margin:       10,
        filename:     `Factura_${randomInvoiceNum}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      
      html2pdf().set(opt).from(element).save();
    });
  }

  
  /**
   * Initialize page scripting once DOM content is ready.
   * Inicializa el script de la página cuando el contenido DOM está listo.
   */
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('ticketInfo');
  });

  /**
   * Format cop.
   * Formatear cop.
   */
  function _formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  /**
   * Format date.
   * Formatear date.
   */
  function _formatDate(isoDate) {
    if (!isoDate) return '–';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
});
