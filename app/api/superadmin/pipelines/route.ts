import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServer } from '@/lib/supabaseServer';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { data: pipelines, error } = await supabaseAdmin
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pipelines });
}

export async function POST(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { name, category, is_renewal } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('pipelines')
            .insert({ name, category, is_renewal })
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'CREATE_PIPELINE',
            entity: 'pipelines',
            entity_id: data.id,
            metadata: { name, category, is_renewal }
        });

        return NextResponse.json({ success: true, pipeline: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { id, name, category, is_renewal } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('pipelines')
            .update({ name, category, is_renewal })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'UPDATE_PIPELINE',
            entity: 'pipelines',
            entity_id: id,
            metadata: { name, category, is_renewal }
        });

        return NextResponse.json({ success: true, pipeline: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('Pipeline ID is required');

        const { error } = await supabaseAdmin.from('pipelines').delete().eq('id', id);
        if (error) throw new Error(error.message);

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'DELETE_PIPELINE',
            entity: 'pipelines',
            entity_id: id,
            metadata: { deleted_pipeline_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
