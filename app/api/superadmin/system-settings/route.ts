import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest } from '@/utils/auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function GET(request: Request) {
    const auth = await authenticateApiRequest(request, ['superadmin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { data: settings, error } = await supabaseAdmin
        .from('system_settings')
        .select('setting_key, setting_value');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Transform array of {key, value} to a single object
    const settingsObj = (settings || []).reduce((acc: any, curr) => {
        acc[curr.setting_key] = curr.setting_value;
        return acc;
    }, {});

    return NextResponse.json({ settings: settingsObj });
}

export async function POST(request: Request) {
    const auth = await authenticateApiRequest(request, ['superadmin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();

        // Body is expected to be { COMPANY_NAME: "value", ... }
        const upserts = Object.keys(body).map(key => ({
            setting_key: key,
            setting_value: body[key]
        }));

        const { error } = await supabaseAdmin
            .from('system_settings')
            .upsert(upserts, { onConflict: 'setting_key' });

        if (error) throw new Error(error.message);

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: auth.user.id, action: 'UPDATE_SYSTEM_SETTINGS', entity: 'system_settings', entity_id: null,
            metadata: { updated_keys: Object.keys(body) }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
