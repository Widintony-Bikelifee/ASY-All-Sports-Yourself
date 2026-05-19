
/* 
   authService.js - Authentication service
   Handles login, registration, and user profile operations with Supabase
   Supports two user roles: 'user' (deportista) and 'admin_cancha' (administrador)
    */

/* 
   LOGIN - Authenticate user with email/password
 
   @param {string} email    - User's email address
   @param {string} password - User's password
   @returns {object}        - User data (nombre, apellido, rol)
   @throws {Error}          - If authentication fails
   */
async function loginUser(email, password) {
  // Sign in with Supabase using email and password
  const { data: sessionData, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  // If there's an error, throw it to be handled by the caller
  if (error) throw error;

  // Fetch additional user data from the 'usuarios' table — include rol
  const { data: usuario, error: dbError } =
    await supabaseClient
      .from('usuarios')
      .select('nombre, apellido, rol')  // Include rol for redirect logic
      .eq('id', sessionData.user.id)
      .single();

  // If database error, throw custom error message
  if (dbError) throw new Error('No se encontraron datos del usuario.');

  // Return user profile data (includes rol)
  return usuario;
}

/* 
   REGISTER - Create new user account
   @param {string} email    - User's email address
   @param {string} password - User's chosen password
   @param {string} nombre   - User's first name
   @param {string} apellido - User's last name
   @returns {object}        - Created user object
   @throws {Error}          - If registration fails
   */
async function registerUserAuth(email, password, nombre, apellido) {
  // Sign up new user with Supabase Auth
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      // Store additional user metadata in Auth
      data: { nombre, apellido }
    }
  });

  // If there's an error, throw it
  if (error) throw error;

  // Return the created user object
  return data.user;
}

/* 
   INSERT PROFILE - Create user profile in database
   
   @param {string} userId - The authenticated user's ID
   @param {object} data   - Profile data { name, lastname, phone, email }
   @returns {void}
   @throws {Error}        - If insert fails
   */
async function insertUserProfile(userId, data) {
  // Insert new row into usuarios table
  const { error } = await supabaseClient
    .from('usuarios')
    .insert([{
      id: userId,                         // Link to auth user ID
      nombre: data.name,                  // First name
      apellido: data.lastname,            // Last name
      telefono: data.phone || null,       // Phone (optional)
      correo_electronico: data.email,     // Email
      rol: data.rol || 'user',            // Role: 'user' | 'admin_cancha'
    }]);

  // If there's an error, throw it
  if (error) throw error;
}

/* 
   GET USER ROLE - Fetch the current authenticated user's role

   @returns {string} - 'user' | 'admin_cancha' | null
   @description - Queries usuarios table for the role of the active session user
   */
async function getUserRole() {
  // Get current session
  const { data } = await supabaseClient.auth.getSession();
  const userId = data?.session?.user?.id;
  if (!userId) return null;

  // Query rol from usuarios table
  const { data: row, error } = await supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', userId)
    .single();

  if (error) return null;
  return row?.rol ?? 'user';
}

/* 
   GET USER PROFILE - Fetch the user's profile details

   @param {string} userId - The authenticated user's ID
   @returns {object} - The user's profile data
   */
async function getUserProfile(userId) {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/* 
   UPDATE USER PROFILE - Update user details

   @param {string} userId - The authenticated user's ID
   @param {object} data - The updated profile data { nombre, apellido, telefono }
   */
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

// Expose functions globally for use in other scripts
window.loginUser         = loginUser;
window.registerUserAuth  = registerUserAuth;
window.insertUserProfile = insertUserProfile;
window.getUserRole       = getUserRole;
window.getUserProfile    = getUserProfile;
window.updateUserProfile = updateUserProfile;