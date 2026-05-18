"use strict";

/* 
   venuesService.js - Venues and reservations service
   Data access layer for scenarios and bookings.
   All Supabase calls live here — venues.js only calls these functions.
    */

const VenuesService = (() => {

/*
     GET ESCENARIO BY ID - Fetch single venue by ID
     @param {number|string} id - Venue ID
     @returns {object} - { data: object|null, error: object|null }
     */
  async function getEscenarioById(id) {
    const { data, error } = await supabaseClient
      .from("escenarios")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  }

  /*
     GET SCENARIOS - Fetch all venues/sports facilities

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

  /* 
     GET CURRENT USER - Get authenticated user
     
     @returns {object|null} - User object or null if not logged in
     @description - Returns the currently authenticated user or null
     */
  async function getUsuarioActual() {
    // Get session data from Supabase Auth
    const { data } = await supabaseClient.auth.getSession();
    // Return user object from session, or null if no session
    return data?.session?.user ?? null;
  }

  /* 
     INSERT RESERVATION - Create new booking
     
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
        usuario_id:   usuario.id,
        escenario_id: reserva.escenario_id,
        fecha:        reserva.fecha,
        hora_inicio:  reserva.hora_inicio,
        hora_fin:     reserva.hora_fin,
        estado:       "pendiente",
        metodo_pago:  reserva.metodo_pago ?? "efectivo",
      }]);

    return { error };
  }

  /* 
     GET MY RESERVATIONS - Fetch user's bookings
    
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

  /* 
     GET MIS ESCENARIOS - Fetch venues owned by the current admin
     
     @returns {object} - { data: Array, error: object|null }
     @description - Returns only scenarios where propietario_id matches current user
     */
  async function getMisEscenarios() {
    const usuario = await getUsuarioActual();
    if (!usuario) {
      return { data: [], error: { message: "No hay sesión activa." } };
    }

    const { data, error } = await supabaseClient
      .from("escenarios")
      .select("*")
      .eq("propietario_id", usuario.id)
      .order("id");

    return { data: data ?? [], error };
  }

  /* 
     INSERT ESCENARIO - Create a new venue
     @param {object} escenario - Venue details
     @returns {object} - { data, error }
     */
  async function insertEscenario(escenario) {
    const usuario = await getUsuarioActual();
    if (!usuario) return { data: null, error: { message: "No hay sesión activa." } };

    // Attach the current user's ID as the owner of this venue
    const payload = { ...escenario, propietario_id: usuario.id };

    const { data, error } = await supabaseClient
      .from("escenarios")
      .insert([payload])
      .select();
    return { data, error };
  }

  /* 
     UPDATE ESCENARIO - Update an existing venue
     @param {number|string} id - Venue ID
     @param {object} updates - Venue fields to update
     @returns {object} - { data, error }
     */
  async function updateEscenario(id, updates) {
    const { data, error } = await supabaseClient
      .from("escenarios")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  }

  /* 
     DELETE ESCENARIO - Delete a venue
     @param {number|string} id - Venue ID
     @returns {object} - { error }
     */
  async function deleteEscenario(id) {
    const { error } = await supabaseClient
      .from("escenarios")
      .delete()
      .eq("id", id);
    return { error };
  }

  /* 
     CANCEL RESERVATION - Update estado to 'cancelada'
     
     @param {string|number} reservaId - Reservation ID to cancel
     @returns {object} - { error: object|null }
     @description - Sets the reservation status to 'cancelada' for the
                    current user's reservation only (safe: filters by usuario_id)
     */
  async function cancelReserva(reservaId) {
    const usuario = await getUsuarioActual();
    if (!usuario) {
      return { error: { message: "No hay sesión activa." } };
    }

    const { error } = await supabaseClient
      .from("reservas")
      .update({ estado: "cancelada" })
      .eq("id", reservaId)
      .eq("usuario_id", usuario.id);  // Safety: only cancel own reservations

    return { error };
  }

  /* 
     GET RESERVAS ADMIN - All reservations for the current admin's venues

     @returns {object} - { data: Array, error: object|null }
     @description - Fetches reservations joined with escenarios and usuarios,
                    filtered to venues owned by the current admin user.
     */
  async function getReservasAdmin() {
    const usuario = await getUsuarioActual();
    if (!usuario) {
      return { data: [], error: { message: "No hay sesión activa." } };
    }

    // Step 1: get venue IDs owned by this admin
    const { data: escenarios, error: escError } = await supabaseClient
      .from("escenarios")
      .select("id")
      .eq("propietario_id", usuario.id);

    if (escError) return { data: [], error: escError };
    if (!escenarios?.length) return { data: [], error: null }; // no venues yet

    const ids = escenarios.map(e => e.id);

    // Step 2: fetch reservations with venue info only (no usuarios join to avoid FK issues)
    const { data: reservas, error: resError } = await supabaseClient
      .from("reservas")
      .select(`
        id,
        usuario_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        escenarios ( id, nombre, tipo, precio )
      `)
      .in("escenario_id", ids)
      .order("fecha", { ascending: false });

    if (resError) return { data: [], error: resError };
    if (!reservas?.length) return { data: [], error: null };

    // Step 3: try to fetch metodo_pago separately (column may not exist yet)
    let pagosMap = {};
    try {
      const { data: pagos } = await supabaseClient
        .from("reservas")
        .select("id, metodo_pago")
        .in("id", reservas.map(r => r.id));
      if (pagos) pagos.forEach(p => { pagosMap[p.id] = p.metodo_pago; });
    } catch (_) { /* column doesn't exist yet, ignore */ }

    // Step 4: try to fetch user names
    const userIds = [...new Set(reservas.map(r => r.usuario_id).filter(Boolean))];
    let usersMap = {};
    if (userIds.length) {
      try {
        const { data: users } = await supabaseClient
          .from("usuarios")
          .select("id, nombre, apellido, correo_electronico, telefono")
          .in("id", userIds);
        if (users) users.forEach(u => { usersMap[u.id] = u; });
      } catch (_) { /* ignore */ }
    }

    // Step 5: merge all data
    const merged = reservas.map(r => ({
      ...r,
      metodo_pago: pagosMap[r.id] ?? null,
      usuarios: usersMap[r.usuario_id] ?? null,
    }));

    return { data: merged, error: null };
  }

  /* 
     UPDATE RESERVA ESTADO - Change reservation status (admin action)

     @param {string|number} reservaId - Reservation ID
     @param {string} estado           - New status: 'confirmada'|'cancelada'|'completada'
     @returns {object} - { error }
     */
  async function updateReservaEstado(reservaId, estado) {
    const { error } = await supabaseClient
      .from("reservas")
      .update({ estado })
      .eq("id", reservaId);
    return { error };
  }

  // Public API - expose these functions externally
  return {
    getEscenarioById,     // Get single venue by ID
    getEscenarios,         // Get all venues
    getMisEscenarios,      // Get current admin's venues
    getUsuarioActual,      // Get current user
    insertReserva,         // Create reservation
    getMisReservas,        // Get user's reservations
    cancelReserva,         // Cancel a reservation
    getReservasAdmin,      // Get all reservations for admin's venues
    updateReservaEstado,   // Change reservation status (admin)
    insertEscenario,       // Create venue
    updateEscenario,       // Update venue
    deleteEscenario,       // Delete venue
  };

})();

// Expose globally for use in other scripts
window.VenuesService = VenuesService;
