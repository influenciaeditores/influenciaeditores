// js/supabase-config.js

const SUPABASE_URL = 'https://tntzfezgtwkfpxirmifz.supabase.co'; // Tu URL real
const SUPABASE_KEY = 'sb_publishable_H79zfD0NSTvVdvEr_yrE6A__SAtvsU_'; // Tu anon key real

// 1. Inicializamos el cliente en una variable con nombre propio
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Reasignamos la instancia inicializada para que todos tus archivos (registro.js, login.js, etc.) la usen directamente
window.supabase = window.supabaseClient;