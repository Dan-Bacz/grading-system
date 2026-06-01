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

const supabase = createClient(url, key, { auth: { persistSession: false } });

(async ()=>{
  try {
    console.log('Signing in as admin@test.com');
    const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    if (signErr) {
      console.error('Sign-in error:', signErr.message || signErr);
      return;
    }
    const session = signData.session;
    console.log('Signed in, user id:', session.user.id);

    // Create a new client that sends the access token for authenticated requests
    const authed = createClient(url, key, { global: { headers: { Authorization: `Bearer ${session.access_token}` } } });

    console.log('Querying own profile as admin...');
    const { data, error } = await authed
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    if (error) {
      console.error('Own profile query error:', error.message || error, error);
    } else {
      console.log('Own profile row:', JSON.stringify(data, null, 2));
    }

    console.log('Querying all profiles as admin...');
    const { data: allProfiles, error: allError } = await authed.from('profiles').select('*');
    if (allError) {
      console.error('All profiles query error:', allError.message || allError, allError);
    } else {
      console.log('Profiles rows:', allProfiles.length);
      console.log(JSON.stringify(allProfiles, null, 2));
    }

    console.log('Querying admins...');
    const { data: admins, error: adminErr } = await authed.from('admins').select('*');
    if (adminErr) {
      console.error('Admins query error:', adminErr.message || adminErr);
    } else {
      console.log('Admins rows:', admins.length);
      console.log(JSON.stringify(admins, null, 2));
    }
  } catch (e) {
    console.error('Unexpected error', e.message || e);
  }
})();
