import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabaseServer';
import { authenticateApiRequest } from '@/utils/auth';

export async function GET(request: Request) {
    const auth = await authenticateApiRequest(request, ['superadmin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabaseSession = await createServer();

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
