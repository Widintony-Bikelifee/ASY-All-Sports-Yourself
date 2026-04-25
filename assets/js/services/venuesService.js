"use strict";

/* 
   venuesService.js - Venues and reservations service
   Data access layer for scenarios and bookings.
   All Supabase calls live here — venues.js only calls these functions.
    */

const VenuesService = (() => {

  /* ═══════════════════════════════════════
     GET SCENARIOS - Fetch all venues/sports facilities
     ═══════════════════════════════════════
     @returns {object} - { data: Array, error: object|null }
     @description - Returns all scenarios ordered by ID
     */
  async function getEscenarios() {
    // Query escenarios table, select all fields, order by id
    const { data, error } = await supabaseClient
      .from("escenarios")
      .select("*")
      .order("id");

    // Return data array or empty array if null, plus any error
    return { data: data ?? [], error };
  }

  /* ═══════════════════════════════════════
     GET CURRENT USER - Get authenticated user
     ═══════════════════════════════════════
     @returns {object|null} - User object or null if not logged in
     @description - Returns the currently authenticated user or null
     */
  async function getUsuarioActual() {
    // Get session data from Supabase Auth
    const { data } = await supabaseClient.auth.getSession();
    // Return user object from session, or null if no session
    return data?.session?.user ?? null;
  }

  /* ═══════════════════════════════════════
     INSERT RESERVATION - Create new booking
     ═══════════════════════════════════════
     @param {object} reserva - { escenario_id, fecha, hora_inicio, hora_fin }
     @returns {object} - { error: object|null }
     @description - Inserts a new reservation for the current user
     */
  async function insertReserva(reserva) {
    // First get the current authenticated user
    const usuario = await getUsuarioActual();

    // If no user is logged in, return error
    if (!usuario) {
      return { error: { message: "No hay sesión activa." } };
    }

    // Insert reservation into reservas table
    const { error } = await supabaseClient
      .from("reservas")
      .insert([{
        usuario_id:   usuario.id,      // Link to user ID
        escenario_id: reserva.escenario_id,  // Link to venue
        fecha:        reserva.fecha,         // Booking date
        hora_inicio:  reserva.hora_inicio,   // Start time
        hora_fin:     reserva.hora_fin,      // End time
        estado:       "pendiente",           // Default status
      }]);

    // Return any error that occurred
    return { error };
  }

  /* ═══════════════════════════════════════
     GET MY RESERVATIONS - Fetch user's bookings
     ═══════════════════════════════════════
     @returns {object} - { data: Array, error: object|null }
     @description - Returns all reservations for logged-in user with venue info
     */
  async function getMisReservas() {
    // Get current user
    const usuario = await getUsuarioActual();

    // If no user logged in, return empty array with error
    if (!usuario) {
      return { data: [], error: { message: "No hay sesión activa." } };
    }

    // Query reservas table with join to escenarios
    const { data, error } = await supabaseClient
      .from("reservas")
      .select(`
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        escenarios ( nombre, tipo, ubicacion, precio )
      `)
      .eq("usuario_id", usuario.id)  // Filter by current user
      .order("fecha", { ascending: false });  // Newest first

    // Return data array or empty array if null, plus any error
    return { data: data ?? [], error };
  }

  // Public API - expose these functions externally
  return {
    getEscenarios,      // Get all venues
    getUsuarioActual,   // Get current user
    insertReserva,      // Create reservation
    getMisReservas,     // Get user's reservations
  };

})();

// Expose globally for use in other scripts
window.VenuesService = VenuesService;
