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

    const { data: templates, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates });
}

export async function POST(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { name, subject, body: content, insurance_category, policy_type, policy_flow, is_active } = body;

        const { data, error } = await supabaseAdmin
            .from('email_templates')
            .insert({ name, subject, body: content, insurance_category, policy_type, policy_flow, is_active: is_active ?? true })
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'CREATE_EMAIL_TEMPLATE', entity: 'email_templates', entity_id: data.id,
            metadata: { name, subject, is_active }
        });

        return NextResponse.json({ success: true, template: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { id, name, subject, body: content, insurance_category, policy_type, policy_flow, is_active } = body;

        const { data, error } = await supabaseAdmin
            .from('email_templates')
            .update({ name, subject, body: content, insurance_category, policy_type, policy_flow, is_active })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'UPDATE_EMAIL_TEMPLATE', entity: 'email_templates', entity_id: id,
            metadata: { name, subject, is_active }
        });

        return NextResponse.json({ success: true, template: data });
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
        if (!id) throw new Error('Template ID is required');

        const { error } = await supabaseAdmin.from('email_templates').delete().eq('id', id);
        if (error) throw new Error(error.message);

        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'DELETE_EMAIL_TEMPLATE', entity: 'email_templates', entity_id: id,
            metadata: { deleted_template_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
