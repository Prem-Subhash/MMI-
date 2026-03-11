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

export async function GET(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const pipeline_id = searchParams.get('pipeline_id');

    if (!pipeline_id) return NextResponse.json({ error: 'Pipeline ID required' }, { status: 400 });

    const { data: stages, error } = await supabaseAdmin
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipeline_id)
        .order('stage_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ stages });
}

export async function POST(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { pipeline_id, stage_name, stage_order, mandatory_fields } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('pipeline_stages')
            .insert({ pipeline_id, stage_name, stage_order, mandatory_fields: mandatory_fields || {} })
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'CREATE_PIPELINE_STAGE', entity: 'pipeline_stages', entity_id: data.id,
            metadata: { pipeline_id, stage_name, stage_order }
        });

        return NextResponse.json({ success: true, stage: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { id, stage_name, stage_order, mandatory_fields } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('pipeline_stages')
            .update({ stage_name, stage_order, mandatory_fields })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'UPDATE_PIPELINE_STAGE', entity: 'pipeline_stages', entity_id: id,
            metadata: { stage_name, stage_order }
        });

        return NextResponse.json({ success: true, stage: data });
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
        if (!id) throw new Error('Stage ID is required');

        const { error } = await supabaseAdmin.from('pipeline_stages').delete().eq('id', id);
        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'DELETE_PIPELINE_STAGE', entity: 'pipeline_stages', entity_id: id,
            metadata: { deleted_stage_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
