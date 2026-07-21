import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error(
    'Missing Supabase admin configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return NextResponse.json(
      { error: 'Supabase admin configuration is missing.' },
      { status: 500 }
    );
  }

  const [{ data: pending, error: pendingError }, { data: teachers, error: teacherError }, { data: students, error: studentError }, { data: grades, error: gradeError }] = await Promise.all([
    adminClient.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    adminClient.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
    adminClient.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
    adminClient.from('grades').select('*').order('created_at', { ascending: false }),
  ]);

  if (pendingError || teacherError || studentError || gradeError) {
    const errorMessage = pendingError?.message || teacherError?.message || studentError?.message || gradeError?.message;
    return NextResponse.json({ error: errorMessage || 'Unable to load admin data.' }, { status: 500 });
  }

  return NextResponse.json({ pending, teachers, students, grades });
}

export async function PATCH(request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return NextResponse.json(
      { error: 'Supabase admin configuration is missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { user_id, status, assigned_subject } = body;
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    const updatePayload = { status };
    if (assigned_subject !== undefined) {
      updatePayload.assigned_subject = assigned_subject;
    }

    const { data, error } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let emailSent = false;
    let emailError = null;

    if (status === 'active') {
      const { data: profileData, error: profileFetchError } = await adminClient
        .from('profiles')
        .select('email')
        .eq('user_id', user_id)
        .single();

      if (!profileFetchError && profileData?.email) {
        const origin = new URL(request.url).origin;
        try {
          const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(profileData.email, {
            redirectTo: `${origin}/login`,
          });

          if (inviteError) {
            emailError = inviteError.message;
          } else {
            emailSent = true;
          }
        } catch (inviteException) {
          emailError = inviteException.message || String(inviteException);
        }
      }
    }

    return NextResponse.json({
      data,
      message: status === 'active'
        ? (emailSent ? 'Account approved and notification email sent.' : 'Account approved.')
        : 'Profile updated successfully.',
      emailSent,
      emailError,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return NextResponse.json(
      { error: 'Supabase admin configuration is missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Delete the user from Supabase auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });
    }

    // Delete the profile record
    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', user_id);

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { message: 'Account rejected and deleted successfully.' } });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
