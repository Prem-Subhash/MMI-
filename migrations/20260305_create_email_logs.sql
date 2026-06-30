-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.temp_leads_basics(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.email_templates(id),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to insert logs
CREATE POLICY "Service role can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (true);
