import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { authenticateApiRequest } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const zip = searchParams.get('zip');

    if (!zip || zip.length !== 5 || !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: 'Valid 5-digit ZIP code is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('zip_codes_lookup')
      .select('city, state, county')
      .eq('zip_code', zip);

    if (error) {
      console.error('ZIP lookup error:', error);
      return NextResponse.json({ error: 'Database error during ZIP lookup' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Deduplicate results if there are multiple identical city/state/county combinations for some reason
    const uniqueResults = data.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.city === item.city && t.state === item.state && t.county === item.county
      ))
    );

    return NextResponse.json({
      success: true,
      results: uniqueResults,
    });
  } catch (err: any) {
    console.error('Unexpected ZIP lookup error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
