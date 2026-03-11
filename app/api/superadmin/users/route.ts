import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServer } from '@/lib/supabaseServer';

// Setup Supabase Admin Client using Service Role Key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify superadmin access
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

    const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users });
}

export async function POST(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { email, password, full_name, role } = body;

        // 1. Create User in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) throw new Error(authError.message);

        // 2. Insert into profiles (Handling case if there is a trigger that already created it)
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: authUser.user.id,
            email,
            full_name,
            role,
        });

        if (profileError) {
            // Rollback auth user creation if profile fails
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw new Error(profileError.message);
        }

        // 3. Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'CREATE_USER',
            entity: 'profiles',
            entity_id: authUser.user.id,
            metadata: { email, role }
        });

        return NextResponse.json({ success: true, user: authUser.user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { id, role } = body;

        const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
        if (error) throw new Error(error.message);

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'UPDATE_USER_ROLE',
            entity: 'profiles',
            entity_id: id,
            metadata: { new_role: role }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabaseSession = await createServer();
    const auth = await verifySuperAdmin(supabaseSession);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('User ID is required');

        // Note: Check if they are trying to delete themselves to prevent accidental lockout
        if (id === auth.user.id) {
            throw new Error('You cannot delete your own account.');
        }

        // Delete from profiles first to ensure no foreign key issues
        await supabaseAdmin.from('profiles').delete().eq('id', id);

        // Delete from Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw new Error(error.message);

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id,
            action: 'DELETE_USER',
            entity: 'profiles',
            entity_id: id,
            metadata: { deleted_user_id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
