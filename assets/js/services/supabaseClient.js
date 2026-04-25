/* 
   supabaseClient.js - Supabase client initialization
   Creates and exports the Supabase client for database operations
    */

// Supabase project URL - endpoint for all API requests
const supabaseUrl = 'https://syiyfvfuondxuntkoumb.supabase.co';

// Supabase anonymous/public key - client-side access token
// Note: This is the publishable key, not the secret key
const supabaseKey = 'sb_publishable_7mNlNfecB1RnCxLqRvprzA_jOmvwgRW';

// Create Supabase client instance with URL and key
// This client is used for all database operations (auth, queries, etc.)
const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

/* Export for module systems (commented out - using window instead)
// export default supabaseClient;
*/

// Expose globally so other scripts can access it
window.supabaseClient = supabaseClient; 