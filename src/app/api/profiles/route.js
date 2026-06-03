import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_EXTERNAL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

export async function POST(request) {
  try {
    const body = await request.json()
    const required = ['user_id', 'email', 'full_name', 'role']
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ error: `Missing ${k}` }, { status: 400 })
      }
    }

    const profileRow = {
      user_id: body.user_id,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      phone: body.phone || null,
      address: body.address || null,
      assigned_subject: body.assigned_subject || null,
      status: body.status || 'pending',
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileRow, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
