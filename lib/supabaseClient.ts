import { createBrowserClient } from '@supabase/ssr'

/* -------------------------------------------------
   SUPABASE CLIENT (ADDED SSR)
------------------------------------------------- */
let _client: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    return (createClient() as any)[prop]
  }
})

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
