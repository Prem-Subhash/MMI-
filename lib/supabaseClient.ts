import { createBrowserClient } from '@supabase/ssr'

/* -------------------------------------------------
   SUPABASE CLIENT (ADDED SSR)
------------------------------------------------- */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const createClient = () => {
  return supabase;
}

/* -------------------------------------------------
   PIPELINE HELPERS (PHASE 2)
------------------------------------------------- */

/**
 * Get Personal Lines pipeline ID
 * Used during lead creation
 */
export async function getPersonalLinesPipeline(): Promise<string> {
  const { data, error } = await supabase
    .from('pipelines')
    .select('id')
    .eq('name', 'Personal Lines')
    .single()

  if (error || !data) {
    throw new Error('Personal Lines pipeline not found')
  }

  return data.id
}

/**
 * Get first stage (New Lead) for a pipeline
 */
export async function getInitialStage(
  pipelineId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline_id', pipelineId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error('Initial pipeline stage not found')
  }

  return data.id
}
