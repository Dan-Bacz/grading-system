import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return NextResponse.json(
      { error: 'Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const required = ['email', 'password', 'full_name', 'role'];
    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `Missing ${key}` }, { status: 400 });
      }
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(body.email).trim().toLowerCase())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: String(body.email).trim().toLowerCase(),
      password: body.password,
      email_confirm: false,
      user_metadata: {
        full_name: body.full_name,
        role: body.role,
        phone: body.phone || null,
        address: body.address || null,
        assigned_subject: body.assigned_subject || null,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const userId = createData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Could not create user.' }, { status: 500 });
    }

    const profileRow = {
      user_id: userId,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      phone: body.phone || null,
      address: body.address || null,
      assigned_subject: body.assigned_subject || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(profileRow, { onConflict: 'user_id' });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { user: createData.user } });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
