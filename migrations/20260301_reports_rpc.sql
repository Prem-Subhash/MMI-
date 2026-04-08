-- RPC function for KPI Summary
CREATE OR REPLACE FUNCTION public.get_report_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_date_type TEXT DEFAULT 'effective',
    p_flow TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_csr UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_policies', COUNT(id),
        'total_premium', COALESCE(SUM(total_premium), 0),
        'new_business_premium', COALESCE(SUM(total_premium) FILTER (WHERE policy_flow = 'new'), 0),
        'renewal_premium', COALESCE(SUM(total_premium) FILTER (WHERE policy_flow = 'renewal'), 0),
        'personal_line_count', COUNT(id) FILTER (WHERE insurence_category = 'personal'),
        'commercial_line_count', COUNT(id) FILTER (WHERE insurence_category = 'commercial')
    ) INTO result
    FROM public.temp_leads_basics
    WHERE (
        CASE 
            WHEN p_date_type = 'expiration' THEN renewal_date
            ELSE effective_date
        END
    ) >= p_start_date
    AND (
        CASE 
            WHEN p_date_type = 'expiration' THEN renewal_date
            ELSE effective_date
        END
    ) <= p_end_date
      AND (p_flow IS NULL OR p_flow = '' OR policy_flow = p_flow)
      AND (p_category IS NULL OR p_category = '' OR insurence_category = p_category)
      AND (p_csr IS NULL OR assigned_csr = p_csr);

    RETURN result;
END;
$$;
