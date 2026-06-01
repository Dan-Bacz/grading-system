const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(path) {
  const data = fs.readFileSync(path, 'utf8');
  return data.split(/\r?\n/).filter(Boolean).reduce((env, line) => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      env[line.slice(0, idx)] = line.slice(idx + 1);
    }
    return env;
  }, {});
}

const env = loadEnv('.env.local');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'admin123',
  });

  if (signErr) {
    console.error('Sign-in error:', signErr);
    process.exit(1);
  }

  const session = signData.session;
  console.log('Signed in admin', session.user.id);

  const authed = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });

  const { data, error } = await authed.from('admins').insert([
    { user_id: session.user.id },
  ], { returning: 'representation' });

  if (error) {
    console.error('Insert admins error:', error);
    process.exit(1);
  }

  console.log('Inserted admin row:', JSON.stringify(data, null, 2));

  const { data: admins, error: adminErr } = await authed.from('admins').select('*');
  if (adminErr) {
    console.error('Admins query error:', adminErr);
    process.exit(1);
  }
  console.log('Admins now:', JSON.stringify(admins, null, 2));
})();