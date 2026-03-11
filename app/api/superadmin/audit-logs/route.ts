import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabaseServer';

async function verifySuperAdmin(supabaseSession: any) {
    const { data: { user } } = await supabaseSession.auth.getUser();
    if (!user) return { authorized: false, error: 'Unauthorized', status: 401 };

    const { data: profile } = await supabaseSession.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'superadmin') return { authorized: false, error: 'Forbidden', status: 403 };

    return { authorized: true, user };
}

export async function GET() {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { data: logs, error } = await supabaseSession
        .from('audit_logs')
        .select(`
            id,
            action,
            entity,
            entity_id,
            metadata,
            created_at,
            user_id,
            profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ logs });
}
