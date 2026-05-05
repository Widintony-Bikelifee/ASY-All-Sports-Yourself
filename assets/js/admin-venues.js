"use strict";

/* ═══════════════════════════════════════
   admin-venues.js - Admin Venues Management
   Handles CRUD operations for venues in the admin panel.
   ═══════════════════════════════════════ */

const AdminVenues = (() => {
  // DOM Elements
  const tableBody = document.getElementById("venues-table-body");
  const modal = document.getElementById("venue-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBtnSave = document.getElementById("modal-btn-save");
  const modalError = document.getElementById("modal-error");

  // Form Fields
  const inputId = document.getElementById("venue-id");
  const inputNombre = document.getElementById("venue-nombre");
  const inputTipo = document.getElementById("venue-tipo");
  const inputUbicacion = document.getElementById("venue-ubicacion");
  const inputPrecio = document.getElementById("venue-precio");
  const inputImagen = document.getElementById("venue-imagen");

  // State
  let allVenues = [];

  /* Initialize the module */
  async function init() {
    // Basic auth check
    const role = typeof window.getUserRole === "function" ? await window.getUserRole() : null;
    if (role !== "admin_cancha") {
      App.showToast("Acceso denegado. Redirigiendo...", "error");
      setTimeout(() => { window.location.href = "../index.html"; }, 1500);
      return;
    }
    await loadVenues();
  }

  /* Load venues from database and render table */
  async function loadVenues() {
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Cargando...</td></tr>`;
    
    const { data, error } = await window.VenuesService.getMisEscenarios();
    if (error) {
      App.showToast("Error al cargar las canchas", "error");
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
      return;
    }
    
    allVenues = data;
    renderTable();
  }

  /* Format price for display */
  function formatPrice(price) {
    return "$" + Number(price).toLocaleString("es-CO");
  }

  /* Render the data table */
  function renderTable() {
    if (!tableBody) return;
    
    if (allVenues.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No tienes canchas registradas.</td></tr>`;
      return;
    }

    tableBody.innerHTML = allVenues.map(venue => {
      const imgSrc = venue.imagen_url?.startsWith("http")
        ? venue.imagen_url
        : `../assets/img/venues/${venue.imagen_url || "Estadio_Ipiales.jpg"}`;
        
      return `
        <tr>
          <td class="admin-table__img-cell">
            <img src="${imgSrc}" class="admin-table__img" alt="${venue.nombre}" onerror="this.src='../assets/img/venues/Estadio_Ipiales.jpg'" />
          </td>
          <td style="font-weight: 600;">${venue.nombre}</td>
          <td>${venue.ubicacion || "-"}</td>
          <td><span class="admin-tag" style="margin: 0; padding: 0.2rem 0.5rem;">${venue.tipo}</span></td>
          <td>${formatPrice(venue.precio)}</td>
          <td>
            <div class="admin-table__actions">
              <button class="admin-btn-icon admin-btn-icon--edit" onclick="AdminVenues.openModal(${venue.id})" title="Editar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="admin-btn-icon admin-btn-icon--delete" onclick="AdminVenues.deleteVenue(${venue.id})" title="Eliminar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  /* Open modal for Create (no ID) or Edit (with ID) */
  function openModal(id = null) {
    modalError.textContent = "";
    
    if (id) {
      // Edit Mode
      const venue = allVenues.find(v => v.id === id);
      if (!venue) return;
      modalTitle.textContent = "Editar Cancha";
      inputId.value = venue.id;
      inputNombre.value = venue.nombre;
      inputTipo.value = venue.tipo;
      inputUbicacion.value = venue.ubicacion || "";
      inputPrecio.value = venue.precio;
      inputImagen.value = venue.imagen_url || "";
    } else {
      // Create Mode
      modalTitle.textContent = "Añadir Cancha";
      inputId.value = "";
      inputNombre.value = "";
      inputTipo.value = "";
      inputUbicacion.value = "";
      inputPrecio.value = "";
      inputImagen.value = "";
    }
    
    modal.classList.add("open");
  }

  /* Close the modal */
  function closeModal() {
    modal.classList.remove("open");
  }

  /* Save (Create or Update) Venue */
  async function saveVenue() {
    // Validate
    const nombre = inputNombre.value.trim();
    const tipo = inputTipo.value;
    const ubicacion = inputUbicacion.value.trim();
    const precio = parseFloat(inputPrecio.value);
    const imagen_url = inputImagen.value.trim() || null;
    const id = inputId.value;

    if (!nombre || !tipo || isNaN(precio) || precio < 0) {
      modalError.textContent = "Por favor completa todos los campos obligatorios correctamente.";
      return;
    }

    modalError.textContent = "";
    modalBtnSave.disabled = true;
    modalBtnSave.textContent = "Guardando...";

    const payload = { nombre, tipo, ubicacion, precio, imagen_url };

    let result;
    if (id) {
      // Update
      result = await window.VenuesService.updateEscenario(id, payload);
    } else {
      // Create
      result = await window.VenuesService.insertEscenario(payload);
    }

    modalBtnSave.disabled = false;
    modalBtnSave.textContent = "Guardar Cancha";

    if (result.error) {
      console.error(result.error);
      modalError.textContent = "Error de base de datos: " + result.error.message;
      return;
    }

    App.showToast(id ? "Cancha actualizada exitosamente" : "Cancha creada exitosamente");
    closeModal();
    loadVenues();
  }

  /* Delete Venue */
  async function deleteVenue(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.")) {
      return;
    }

    const { error } = await window.VenuesService.deleteEscenario(id);
    if (error) {
      console.error(error);
      App.showToast("Error al eliminar la cancha", "error");
      return;
    }

    App.showToast("Cancha eliminada exitosamente");
    loadVenues();
  }

  return { init, openModal, closeModal, saveVenue, deleteVenue };
})();

// Expose to window for inline HTML handlers
window.AdminVenues = AdminVenues;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  AdminVenues.init();
});
