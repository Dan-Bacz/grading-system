const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(path) {
  const s = fs.readFileSync(path, 'utf8');
  const lines = s.split(/\r?\n/).filter(Boolean);
  const env = {};
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx>0) {
      const k=line.slice(0,idx).trim(); const v=line.slice(idx+1).trim(); env[k]=v;
    }
  }
  return env;
}

const env = loadEnv('.env.local');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing supabase env vars'); process.exit(2); }

const supabase = createClient(url, key);

(async ()=>{
  try {
    console.log('Querying profiles...');
    const { data, error, status } = await supabase.from('profiles').select('*').limit(20);
    if (error) {
      console.error('Profiles error:', error.message || error);
    } else {
      console.log('Profiles rows:', data.length);
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\nQuerying auth.users (requires anon may be allowed)');
    const { data: users, error: uerr } = await supabase.rpc('pg_catalog.pg_get_userbyid');
    // above will likely fail; instead try selecting from auth.users via REST endpoint
  } catch (e) {
    console.error('Unexpected error', e.message||e);
  }
})();
