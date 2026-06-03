/**
 * venuesService.js script file.
 * Archivo de script venuesService.js.
 */
"use strict";



/**
 * VenuesService module.
 * Realiza module.
 */
const VenuesService = (() => {

  
  /**
   * Get escenarios.
   * Obtener escenarios.
   */
  async function getEscenarios() {
    
    const { data, error } = await supabaseClient
      .from("escenarios")
      .select("*")
      .order("id");

    
    return { data: data ?? [], error };
  }

  
  /**
   * Get usuario actual.
   * Obtener usuario actual.
   */
  async function getUsuarioActual() {
    
    const { data } = await supabaseClient.auth.getSession();
    
    return data?.session?.user ?? null;
  }

  
  /**
   * Insert reserva.
   * Insertar reserva.
   */
  async function insertReserva(reserva) {
    
    const usuario = await getUsuarioActual();

    
    if (!usuario) {
      return { error: { message: "No hay sesión activa." } };
    }

    
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

  
  /**
   * Get mis reservas.
   * Obtener mis reservas.
   */
  async function getMisReservas() {
    
    const usuario = await getUsuarioActual();

    
    if (!usuario) {
      return { data: [], error: { message: "No hay sesión activa." } };
    }

    
    const { data, error } = await supabaseClient
      .from("reservas")
      .select(`
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        metodo_pago,
        escenarios ( nombre, tipo, ubicacion, precio )
      `)
      .eq("usuario_id", usuario.id)  
      .order("fecha", { ascending: false });  

    
    return { data: data ?? [], error };
  }

  
  /**
   * Get mis escenarios.
   * Obtener mis escenarios.
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

  
  /**
   * Insert escenario.
   * Insertar escenario.
   */
  async function insertEscenario(escenario) {
    const usuario = await getUsuarioActual();
    if (!usuario) return { data: null, error: { message: "No hay sesión activa." } };

    
    const payload = { ...escenario, propietario_id: usuario.id };

    const { data, error } = await supabaseClient
      .from("escenarios")
      .insert([payload])
      .select();
    return { data, error };
  }

  
  /**
   * Update escenario.
   * Actualizar escenario.
   */
  async function updateEscenario(id, updates) {
    const { data, error } = await supabaseClient
      .from("escenarios")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  }

  
  /**
   * DeleteEscenario.
   * Realiza.
   */
  async function deleteEscenario(id) {
    const { error } = await supabaseClient
      .from("escenarios")
      .delete()
      .eq("id", id);
    return { error };
  }

  
  /**
   * CancelReserva.
   * Realiza.
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
      .eq("usuario_id", usuario.id);  

    return { error };
  }

  
  /**
   * Get reservas admin.
   * Obtener reservas admin.
   */
  async function getReservasAdmin() {
    const usuario = await getUsuarioActual();
    if (!usuario) {
      return { data: [], error: { message: "No hay sesión activa." } };
    }

    
    const { data: escenarios, error: escError } = await supabaseClient
      .from("escenarios")
      .select("id")
      .eq("propietario_id", usuario.id);

    if (escError) return { data: [], error: escError };
    if (!escenarios?.length) return { data: [], error: null }; 

    const ids = escenarios.map(e => e.id);

    
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

    
    let pagosMap = {};
    try {
      const { data: pagos } = await supabaseClient
        .from("reservas")
        .select("id, metodo_pago")
        .in("id", reservas.map(r => r.id));
      if (pagos) pagos.forEach(p => { pagosMap[p.id] = p.metodo_pago; });
    } catch (_) {  }

    
    const userIds = [...new Set(reservas.map(r => r.usuario_id).filter(Boolean))];
    let usersMap = {};
    if (userIds.length) {
      try {
        const { data: users } = await supabaseClient
          .from("usuarios")
          .select("id, nombre, apellido, correo_electronico, telefono")
          .in("id", userIds);
        if (users) users.forEach(u => { usersMap[u.id] = u; });
      } catch (_) {  }
    }

    
    const merged = reservas.map(r => ({
      ...r,
      metodo_pago: pagosMap[r.id] ?? null,
      usuarios: usersMap[r.usuario_id] ?? null,
    }));

    return { data: merged, error: null };
  }

  
  /**
   * Update reserva estado.
   * Actualizar reserva estado.
   */
  async function updateReservaEstado(reservaId, estado) {
    const { error } = await supabaseClient
      .from("reservas")
      .update({ estado })
      .eq("id", reservaId);
    return { error };
  }

  
  return {
    getEscenarios,        
    getMisEscenarios,     
    getUsuarioActual,     
    insertReserva,        
    getMisReservas,       
    cancelReserva,        
    getReservasAdmin,     
    updateReservaEstado,  
    insertEscenario,      
    updateEscenario,      
    deleteEscenario,      
  };

})();


window.VenuesService = VenuesService;
