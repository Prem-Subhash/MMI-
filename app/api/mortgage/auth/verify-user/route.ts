/**
 * @deprecated REQ-003.3: This endpoint and the underlying `mortgage_users` database table are legacy.
 * Authorization across portals is now unified under `profiles.role` and `profiles.portal_access`
 * evaluated directly during login and within `proxy.ts` Edge Middleware.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ authorized: false, error: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseServer
      .from('mortgage_users')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({ authorized: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ authorized: false, error: err.message }, { status: 500 });
  }
}
