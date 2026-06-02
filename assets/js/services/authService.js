



async function loginUser(email, password) {
  
  const { data: sessionData, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  
  if (error) throw error;

  
  const { data: usuario, error: dbError } =
    await supabaseClient
      .from('usuarios')
      .select('nombre, apellido, rol')  
      .eq('id', sessionData.user.id)
      .single();

  
  if (dbError) throw new Error('No se encontraron datos del usuario.');

  
  return usuario;
}


async function registerUserAuth(email, password, nombre, apellido, cedula) {
  
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      
      data: { nombre, apellido, cedula }
    }
  });

  
  if (error) throw error;

  
  return data.user;
}


async function insertUserProfile(userId, data) {
  
  const { error } = await supabaseClient
    .from('usuarios')
    .insert([{
      id: userId,                         
      cedula: data.cedula,                
      nombre: data.name,                  
      apellido: data.lastname,            
      telefono: data.phone || null,       
      correo_electronico: data.email,     
      rol: data.rol || 'user',            
    }]);

  
  if (error) throw error;
}


async function getUserRole() {
  
  const { data } = await supabaseClient.auth.getSession();
  const userId = data?.session?.user?.id;
  if (!userId) return null;

  
  const { data: row, error } = await supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single();

  if (error) return null;
  return row?.rol ?? 'user';
}


async function getUserProfile(userId) {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}


async function updateUserProfile(userId, data) {
  const { error } = await supabaseClient
    .from('usuarios')
    .update({
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono
    })
    .eq('id', userId);

  if (error) throw error;
}


async function loginWithGoogle() {
  
  const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
  const redirectTo = base.includes('/pages')
    ? window.location.origin + '/pages/auth-callback.html'
    : window.location.origin + '/pages/auth-callback.html';

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo
    }
  });

  if (error) throw error;
  return data;
}


async function handleOAuthSession() {
  
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !sessionData?.session) {
    throw new Error('No se pudo obtener la sesión de Google.');
  }

  const authUser = sessionData.session.user;
  const userId   = authUser.id;

  
  const { data: existingUser, error: fetchError } = await supabaseClient
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', userId)
    .maybeSingle();

  
  if (!fetchError && existingUser) {
    return { usuario: existingUser, isNew: false };
  }

  
  const meta      = authUser.user_metadata || {};
  const fullName  = meta.full_name || meta.name || '';
  const nameParts = fullName.trim().split(' ');
  const nombre    = nameParts[0] || 'Usuario';
  const apellido  = nameParts.slice(1).join(' ') || '';
  const email     = authUser.email || '';

  
  const { error: insertError } = await supabaseClient
    .from('usuarios')
    .insert([{
      id:                    userId,
      cedula:                null,       
      nombre:                nombre,
      apellido:              apellido,
      telefono:              null,
      correo_electronico:    email,
      rol:                   'user',     
    }]);

  if (insertError) throw new Error('Error al crear el perfil de usuario.');

  return { usuario: { nombre, apellido, rol: 'user' }, isNew: true };
}


window.loginUser          = loginUser;
window.registerUserAuth   = registerUserAuth;
window.insertUserProfile  = insertUserProfile;
window.getUserRole        = getUserRole;
window.getUserProfile     = getUserProfile;
window.updateUserProfile  = updateUserProfile;
window.loginWithGoogle    = loginWithGoogle;
window.handleOAuthSession = handleOAuthSession;