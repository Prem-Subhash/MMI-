drop extension if exists "pg_net";


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "action" text,
    "entity" text,
    "entity_id" uuid,
    "metadata" jsonb,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."client_insurance_details" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid,
    "insurance_category" text,
    "policy_type" text,
    "full_data" json,
    "verified_by" uuid,
    "verified_at" timestamp without time zone default now()
      );


alter table "public"."client_insurance_details" enable row level security;


  create table "public"."clients" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "email" text,
    "assigned_csr" uuid,
    "created_at" timestamp without time zone default now(),
    "client_name" text default ''::text
      );


alter table "public"."clients" enable row level security;


  create table "public"."csrs" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "email" text,
    "role" text default 'ADMINORCSR'::text,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."csrs" enable row level security;


  create table "public"."email_logs" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid,
    "email_type" text,
    "recipient" text,
    "status" text,
    "error_message" text,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."email_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "subject" text not null,
    "body" text not null,
    "insurance_category" text not null,
    "policy_type" text not null,
    "policy_flow" text not null,
    "is_active" boolean default true,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."form_templates" (
    "id" uuid not null default gen_random_uuid(),
    "form_name" text not null,
    "insurance_category" text not null,
    "fields" jsonb default '[]'::jsonb,
    "is_active" boolean default true,
    "version" integer default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."form_templates" enable row level security;


  create table "public"."lead_stage_history" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "stage_id" uuid not null,
    "stage_name" text,
    "stage_metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."pipeline_stages" (
    "id" uuid not null default gen_random_uuid(),
    "pipeline_id" uuid,
    "stage_name" text not null,
    "stage_order" integer not null,
    "mandatory_fields" jsonb not null,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."pipelines" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category" text not null,
    "is_renewal" boolean default false,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text,
    "email" text,
    "role" text default 'agent'::text,
    "manager_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."system_settings" (
    "id" uuid not null default gen_random_uuid(),
    "setting_key" text,
    "setting_value" text,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."temp_intake_forms" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "form_data" json,
    "status" text default 'sent'::text,
    "submitted_at" timestamp without time zone,
    "reviewed_by" uuid,
    "reviewed_at" timestamp without time zone,
    "form_type" text not null
      );


alter table "public"."temp_intake_forms" enable row level security;


  create table "public"."temp_leads_basics" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text,
    "email" text,
    "insurence_category" text,
    "policy_type" text,
    "assigned_csr" uuid default auth.uid(),
    "created_at" timestamp without time zone default now(),
    "policy_flow" text,
    "client_name" text,
    "form_submitted_at" timestamp with time zone,
    "pipeline_id" uuid not null,
    "current_stage_id" uuid not null default '6e42db37-be4c-431e-bb33-e19bb8f6b966'::uuid,
    "follow_up_date" date,
    "x_date" date,
    "received_date" date,
    "request_type" text,
    "referral" text,
    "notes" text,
    "send_email" boolean default false,
    "stage_metadata" jsonb default '{}'::jsonb,
    "client_id" uuid,
    "renewal_date" date,
    "carrier" text,
    "policy_number" text,
    "current_premium" numeric,
    "renewal_premium" numeric,
    "reminder_sent" boolean default false,
    "business_name" text,
    "date_received" timestamp with time zone default now(),
    "send_email_to_client" boolean default false,
    "total_premium" numeric,
    "status" text,
    "current_stage" text,
    "accepted_at" timestamp with time zone,
    "intake_email_sent" boolean default false,
    "effective_date" date generated always as (COALESCE(renewal_date, (created_at)::date)) stored
      );


alter table "public"."temp_leads_basics" enable row level security;


  create table "public"."uploaded_documents" (
    "id" uuid not null default gen_random_uuid(),
    "intake_form_id" uuid,
    "file_name" text,
    "file_path" text,
    "file_type" text,
    "uploaded_at" timestamp without time zone default now()
      );


alter table "public"."uploaded_documents" enable row level security;


  create table "public"."user_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text,
    "message" text not null,
    "lead_id" uuid,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "link" text,
    "client_name" text
      );


alter table "public"."user_notifications" enable row level security;

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX "client_insurance_details(MAIN VERIFIED INSURANCE DATA)_pkey" ON public.client_insurance_details USING btree (id);

CREATE UNIQUE INDEX "clients(MAIN / VERIFIED CLIENT TABLE)_pkey" ON public.clients USING btree (id);

CREATE UNIQUE INDEX csrs_pkey ON public.csrs USING btree (id);

CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id);

CREATE UNIQUE INDEX email_templates_pkey ON public.email_templates USING btree (id);

CREATE UNIQUE INDEX form_templates_pkey ON public.form_templates USING btree (id);

CREATE INDEX idx_clients_email ON public.clients USING btree (email);

CREATE INDEX idx_clients_phone ON public.clients USING btree (phone);

CREATE INDEX idx_leads_assigned_csr ON public.temp_leads_basics USING btree (assigned_csr);

CREATE INDEX idx_leads_effective_date ON public.temp_leads_basics USING btree (effective_date);

CREATE INDEX idx_leads_insurance_category ON public.temp_leads_basics USING btree (insurence_category);

CREATE INDEX idx_leads_policy_flow ON public.temp_leads_basics USING btree (policy_flow);

CREATE INDEX idx_profiles_manager_id ON public.profiles USING btree (manager_id);

CREATE INDEX idx_stage_metadata ON public.temp_leads_basics USING gin (stage_metadata);

CREATE INDEX idx_user_notifications_created_at ON public.user_notifications USING btree (created_at DESC);

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);

CREATE UNIQUE INDEX lead_stage_history_pkey ON public.lead_stage_history USING btree (id);

CREATE UNIQUE INDEX pipeline_stages_pkey ON public.pipeline_stages USING btree (id);

CREATE UNIQUE INDEX pipelines_pkey ON public.pipelines USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (id);

CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key);

CREATE UNIQUE INDEX temp_intake_forms_pkey ON public.temp_intake_forms USING btree (id);

CREATE UNIQUE INDEX temp_leads_basics_pkey ON public.temp_leads_basics USING btree (id);

CREATE UNIQUE INDEX unique_personal_renewal ON public.temp_leads_basics USING btree (phone, policy_type, renewal_date) WHERE (policy_flow = 'renewal'::text);

CREATE UNIQUE INDEX unique_policy_renewal ON public.temp_leads_basics USING btree (policy_number, renewal_date);

CREATE UNIQUE INDEX uploaded_documents_pkey ON public.uploaded_documents USING btree (id);

CREATE UNIQUE INDEX user_notifications_pkey ON public.user_notifications USING btree (id);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."client_insurance_details" add constraint "client_insurance_details(MAIN VERIFIED INSURANCE DATA)_pkey" PRIMARY KEY using index "client_insurance_details(MAIN VERIFIED INSURANCE DATA)_pkey";

alter table "public"."clients" add constraint "clients(MAIN / VERIFIED CLIENT TABLE)_pkey" PRIMARY KEY using index "clients(MAIN / VERIFIED CLIENT TABLE)_pkey";

alter table "public"."csrs" add constraint "csrs_pkey" PRIMARY KEY using index "csrs_pkey";

alter table "public"."email_logs" add constraint "email_logs_pkey" PRIMARY KEY using index "email_logs_pkey";

alter table "public"."email_templates" add constraint "email_templates_pkey" PRIMARY KEY using index "email_templates_pkey";

alter table "public"."form_templates" add constraint "form_templates_pkey" PRIMARY KEY using index "form_templates_pkey";

alter table "public"."lead_stage_history" add constraint "lead_stage_history_pkey" PRIMARY KEY using index "lead_stage_history_pkey";

alter table "public"."pipeline_stages" add constraint "pipeline_stages_pkey" PRIMARY KEY using index "pipeline_stages_pkey";

alter table "public"."pipelines" add constraint "pipelines_pkey" PRIMARY KEY using index "pipelines_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."system_settings" add constraint "system_settings_pkey" PRIMARY KEY using index "system_settings_pkey";

alter table "public"."temp_intake_forms" add constraint "temp_intake_forms_pkey" PRIMARY KEY using index "temp_intake_forms_pkey";

alter table "public"."temp_leads_basics" add constraint "temp_leads_basics_pkey" PRIMARY KEY using index "temp_leads_basics_pkey";

alter table "public"."uploaded_documents" add constraint "uploaded_documents_pkey" PRIMARY KEY using index "uploaded_documents_pkey";

alter table "public"."user_notifications" add constraint "user_notifications_pkey" PRIMARY KEY using index "user_notifications_pkey";

alter table "public"."audit_logs" add constraint "fk_audit_logs_user_id" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "fk_audit_logs_user_id";

alter table "public"."client_insurance_details" add constraint "client_insurance_details_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) not valid;

alter table "public"."client_insurance_details" validate constraint "client_insurance_details_client_id_fkey";

alter table "public"."client_insurance_details" add constraint "client_insurance_details_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES public.csrs(id) not valid;

alter table "public"."client_insurance_details" validate constraint "client_insurance_details_verified_by_fkey";

alter table "public"."clients" add constraint "clients_assigned_csr_fkey" FOREIGN KEY (assigned_csr) REFERENCES public.csrs(id) not valid;

alter table "public"."clients" validate constraint "clients_assigned_csr_fkey";

alter table "public"."clients" add constraint "email_valid_format" CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."clients" validate constraint "email_valid_format";

alter table "public"."clients" add constraint "phone_exact_10_digits" CHECK ((phone ~ '^[0-9]{10}$'::text)) not valid;

alter table "public"."clients" validate constraint "phone_exact_10_digits";

alter table "public"."csrs" add constraint "csrs_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."csrs" validate constraint "csrs_id_fkey";

alter table "public"."form_templates" add constraint "form_templates_insurance_category_check" CHECK ((insurance_category = ANY (ARRAY['personal'::text, 'commercial'::text]))) not valid;

alter table "public"."form_templates" validate constraint "form_templates_insurance_category_check";

alter table "public"."lead_stage_history" add constraint "fk_lead" FOREIGN KEY (lead_id) REFERENCES public.temp_leads_basics(id) ON DELETE CASCADE not valid;

alter table "public"."lead_stage_history" validate constraint "fk_lead";

alter table "public"."pipeline_stages" add constraint "pipeline_stages_pipeline_id_fkey" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE not valid;

alter table "public"."pipeline_stages" validate constraint "pipeline_stages_pipeline_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_manager_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['csr'::text, 'admin'::text, 'accounting'::text, 'superadmin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "role_check" CHECK ((role = ANY (ARRAY['csr'::text, 'admin'::text, 'superadmin'::text, 'accounting'::text]))) not valid;

alter table "public"."profiles" validate constraint "role_check";

alter table "public"."system_settings" add constraint "system_settings_setting_key_key" UNIQUE using index "system_settings_setting_key_key";

alter table "public"."temp_intake_forms" add constraint "temp_intake_forms_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.temp_leads_basics(id) not valid;

alter table "public"."temp_intake_forms" validate constraint "temp_intake_forms_lead_id_fkey";

alter table "public"."temp_leads_basics" add constraint "fk_profile" FOREIGN KEY (assigned_csr) REFERENCES public.profiles(id) not valid;

alter table "public"."temp_leads_basics" validate constraint "fk_profile";

alter table "public"."temp_leads_basics" add constraint "fk_temp_leads_pipeline" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) not valid;

alter table "public"."temp_leads_basics" validate constraint "fk_temp_leads_pipeline";

alter table "public"."temp_leads_basics" add constraint "lead_phone_10_digits" CHECK (((phone ~ '^[0-9]{10}$'::text) OR (phone IS NULL))) not valid;

alter table "public"."temp_leads_basics" validate constraint "lead_phone_10_digits";

alter table "public"."temp_leads_basics" add constraint "temp_leads_assigned_csr_fkey" FOREIGN KEY (assigned_csr) REFERENCES public.csrs(id) ON DELETE SET NULL not valid;

alter table "public"."temp_leads_basics" validate constraint "temp_leads_assigned_csr_fkey";

alter table "public"."temp_leads_basics" add constraint "temp_leads_basics_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) not valid;

alter table "public"."temp_leads_basics" validate constraint "temp_leads_basics_client_id_fkey";

alter table "public"."temp_leads_basics" add constraint "temp_leads_basics_current_stage_id_fkey" FOREIGN KEY (current_stage_id) REFERENCES public.pipeline_stages(id) not valid;

alter table "public"."temp_leads_basics" validate constraint "temp_leads_basics_current_stage_id_fkey";

alter table "public"."temp_leads_basics" add constraint "temp_leads_basics_pipeline_id_fkey" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) not valid;

alter table "public"."temp_leads_basics" validate constraint "temp_leads_basics_pipeline_id_fkey";

alter table "public"."temp_leads_basics" add constraint "unique_policy_renewal" UNIQUE using index "unique_policy_renewal";

alter table "public"."uploaded_documents" add constraint "uploaded_documents_intake_form_id_fkey" FOREIGN KEY (intake_form_id) REFERENCES public.temp_intake_forms(id) not valid;

alter table "public"."uploaded_documents" validate constraint "uploaded_documents_intake_form_id_fkey";

alter table "public"."user_notifications" add constraint "user_notifications_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.temp_leads_basics(id) ON DELETE CASCADE not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_lead_id_fkey";

alter table "public"."user_notifications" add constraint "user_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_default_pipeline_and_stage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.pipeline_id is null then
    new.pipeline_id := (
      select id from pipelines
      where name = 'Personal Lines'
      limit 1
    );
  end if;

  if new.current_stage_id is null then
    new.current_stage_id := (
      select id from pipeline_stages
      where pipeline_id = new.pipeline_id
      order by stage_order
      limit 1
    );
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_report_summary(p_start_date date, p_end_date date, p_date_type text DEFAULT 'effective'::text, p_flow text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_csr uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result json;
    v_date_col text;
BEGIN
    v_date_col := CASE WHEN p_date_type = 'expiration' THEN 'renewal_date' ELSE 'effective_date' END;

    EXECUTE format('
        SELECT json_build_object(
            ''total_policies'', count(*),
            ''total_premium'', COALESCE(sum(total_premium), 0),
            ''new_business_premium'', COALESCE(sum(CASE WHEN policy_flow = ''new'' THEN total_premium ELSE 0 END), 0),
            ''renewal_premium'', COALESCE(sum(CASE WHEN policy_flow = ''renewal'' THEN total_premium ELSE 0 END), 0),
            ''personal_line_count'', count(*) FILTER (WHERE insurence_category = ''personal''),
            ''commercial_line_count'', count(*) FILTER (WHERE insurence_category = ''commercial'')
        )
        FROM temp_leads_basics
        WHERE %I >= %L AND %I <= %L
        AND (%L IS NULL OR policy_flow = %L)
        AND (%L IS NULL OR insurence_category = %L)
        AND (%L IS NULL OR assigned_csr = %L)',
        v_date_col, p_start_date, v_date_col, p_end_date,
        p_flow, p_flow, p_category, p_category, p_csr, p_csr
    ) INTO result;

    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Final safety fallback
    RETURN json_build_object('error', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_report_summary(p_start_date date, p_end_date date, p_flow text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_csr uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
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
    WHERE effective_date >= p_start_date
      AND effective_date <= p_end_date
      AND (p_flow IS NULL OR p_flow = '' OR policy_flow = p_flow)
      AND (p_category IS NULL OR p_category = '' OR insurence_category = p_category)
      AND (p_csr IS NULL OR assigned_csr = p_csr);

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Set search path for security
  SET search_path = public;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'agent');
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.on_intake_form_completed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only act when form is completed
  IF NEW.status = 'completed' THEN
    UPDATE public.temp_leads_basics
    SET
      status = 'form_submitted',
      form_submitted_at = NOW()
    WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_x_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.renewal_date is not null then
    new.x_date := new.renewal_date - interval '60 days';
  end if;
  return new;
end;
$function$
;

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."client_insurance_details" to "anon";

grant insert on table "public"."client_insurance_details" to "anon";

grant references on table "public"."client_insurance_details" to "anon";

grant select on table "public"."client_insurance_details" to "anon";

grant trigger on table "public"."client_insurance_details" to "anon";

grant truncate on table "public"."client_insurance_details" to "anon";

grant update on table "public"."client_insurance_details" to "anon";

grant delete on table "public"."client_insurance_details" to "authenticated";

grant insert on table "public"."client_insurance_details" to "authenticated";

grant references on table "public"."client_insurance_details" to "authenticated";

grant select on table "public"."client_insurance_details" to "authenticated";

grant trigger on table "public"."client_insurance_details" to "authenticated";

grant truncate on table "public"."client_insurance_details" to "authenticated";

grant update on table "public"."client_insurance_details" to "authenticated";

grant delete on table "public"."client_insurance_details" to "service_role";

grant insert on table "public"."client_insurance_details" to "service_role";

grant references on table "public"."client_insurance_details" to "service_role";

grant select on table "public"."client_insurance_details" to "service_role";

grant trigger on table "public"."client_insurance_details" to "service_role";

grant truncate on table "public"."client_insurance_details" to "service_role";

grant update on table "public"."client_insurance_details" to "service_role";

grant delete on table "public"."clients" to "anon";

grant insert on table "public"."clients" to "anon";

grant references on table "public"."clients" to "anon";

grant select on table "public"."clients" to "anon";

grant trigger on table "public"."clients" to "anon";

grant truncate on table "public"."clients" to "anon";

grant update on table "public"."clients" to "anon";

grant delete on table "public"."clients" to "authenticated";

grant insert on table "public"."clients" to "authenticated";

grant references on table "public"."clients" to "authenticated";

grant select on table "public"."clients" to "authenticated";

grant trigger on table "public"."clients" to "authenticated";

grant truncate on table "public"."clients" to "authenticated";

grant update on table "public"."clients" to "authenticated";

grant delete on table "public"."clients" to "service_role";

grant insert on table "public"."clients" to "service_role";

grant references on table "public"."clients" to "service_role";

grant select on table "public"."clients" to "service_role";

grant trigger on table "public"."clients" to "service_role";

grant truncate on table "public"."clients" to "service_role";

grant update on table "public"."clients" to "service_role";

grant delete on table "public"."csrs" to "anon";

grant insert on table "public"."csrs" to "anon";

grant references on table "public"."csrs" to "anon";

grant select on table "public"."csrs" to "anon";

grant trigger on table "public"."csrs" to "anon";

grant truncate on table "public"."csrs" to "anon";

grant update on table "public"."csrs" to "anon";

grant delete on table "public"."csrs" to "authenticated";

grant insert on table "public"."csrs" to "authenticated";

grant references on table "public"."csrs" to "authenticated";

grant select on table "public"."csrs" to "authenticated";

grant trigger on table "public"."csrs" to "authenticated";

grant truncate on table "public"."csrs" to "authenticated";

grant update on table "public"."csrs" to "authenticated";

grant delete on table "public"."csrs" to "service_role";

grant insert on table "public"."csrs" to "service_role";

grant references on table "public"."csrs" to "service_role";

grant select on table "public"."csrs" to "service_role";

grant trigger on table "public"."csrs" to "service_role";

grant truncate on table "public"."csrs" to "service_role";

grant update on table "public"."csrs" to "service_role";

grant delete on table "public"."email_logs" to "anon";

grant insert on table "public"."email_logs" to "anon";

grant references on table "public"."email_logs" to "anon";

grant select on table "public"."email_logs" to "anon";

grant trigger on table "public"."email_logs" to "anon";

grant truncate on table "public"."email_logs" to "anon";

grant update on table "public"."email_logs" to "anon";

grant delete on table "public"."email_logs" to "authenticated";

grant insert on table "public"."email_logs" to "authenticated";

grant references on table "public"."email_logs" to "authenticated";

grant select on table "public"."email_logs" to "authenticated";

grant trigger on table "public"."email_logs" to "authenticated";

grant truncate on table "public"."email_logs" to "authenticated";

grant update on table "public"."email_logs" to "authenticated";

grant delete on table "public"."email_logs" to "service_role";

grant insert on table "public"."email_logs" to "service_role";

grant references on table "public"."email_logs" to "service_role";

grant select on table "public"."email_logs" to "service_role";

grant trigger on table "public"."email_logs" to "service_role";

grant truncate on table "public"."email_logs" to "service_role";

grant update on table "public"."email_logs" to "service_role";

grant delete on table "public"."email_templates" to "anon";

grant insert on table "public"."email_templates" to "anon";

grant references on table "public"."email_templates" to "anon";

grant select on table "public"."email_templates" to "anon";

grant trigger on table "public"."email_templates" to "anon";

grant truncate on table "public"."email_templates" to "anon";

grant update on table "public"."email_templates" to "anon";

grant delete on table "public"."email_templates" to "authenticated";

grant insert on table "public"."email_templates" to "authenticated";

grant references on table "public"."email_templates" to "authenticated";

grant select on table "public"."email_templates" to "authenticated";

grant trigger on table "public"."email_templates" to "authenticated";

grant truncate on table "public"."email_templates" to "authenticated";

grant update on table "public"."email_templates" to "authenticated";

grant delete on table "public"."email_templates" to "service_role";

grant insert on table "public"."email_templates" to "service_role";

grant references on table "public"."email_templates" to "service_role";

grant select on table "public"."email_templates" to "service_role";

grant trigger on table "public"."email_templates" to "service_role";

grant truncate on table "public"."email_templates" to "service_role";

grant update on table "public"."email_templates" to "service_role";

grant delete on table "public"."form_templates" to "anon";

grant insert on table "public"."form_templates" to "anon";

grant references on table "public"."form_templates" to "anon";

grant select on table "public"."form_templates" to "anon";

grant trigger on table "public"."form_templates" to "anon";

grant truncate on table "public"."form_templates" to "anon";

grant update on table "public"."form_templates" to "anon";

grant delete on table "public"."form_templates" to "authenticated";

grant insert on table "public"."form_templates" to "authenticated";

grant references on table "public"."form_templates" to "authenticated";

grant select on table "public"."form_templates" to "authenticated";

grant trigger on table "public"."form_templates" to "authenticated";

grant truncate on table "public"."form_templates" to "authenticated";

grant update on table "public"."form_templates" to "authenticated";

grant delete on table "public"."form_templates" to "service_role";

grant insert on table "public"."form_templates" to "service_role";

grant references on table "public"."form_templates" to "service_role";

grant select on table "public"."form_templates" to "service_role";

grant trigger on table "public"."form_templates" to "service_role";

grant truncate on table "public"."form_templates" to "service_role";

grant update on table "public"."form_templates" to "service_role";

grant delete on table "public"."lead_stage_history" to "anon";

grant insert on table "public"."lead_stage_history" to "anon";

grant references on table "public"."lead_stage_history" to "anon";

grant select on table "public"."lead_stage_history" to "anon";

grant trigger on table "public"."lead_stage_history" to "anon";

grant truncate on table "public"."lead_stage_history" to "anon";

grant update on table "public"."lead_stage_history" to "anon";

grant delete on table "public"."lead_stage_history" to "authenticated";

grant insert on table "public"."lead_stage_history" to "authenticated";

grant references on table "public"."lead_stage_history" to "authenticated";

grant select on table "public"."lead_stage_history" to "authenticated";

grant trigger on table "public"."lead_stage_history" to "authenticated";

grant truncate on table "public"."lead_stage_history" to "authenticated";

grant update on table "public"."lead_stage_history" to "authenticated";

grant delete on table "public"."lead_stage_history" to "service_role";

grant insert on table "public"."lead_stage_history" to "service_role";

grant references on table "public"."lead_stage_history" to "service_role";

grant select on table "public"."lead_stage_history" to "service_role";

grant trigger on table "public"."lead_stage_history" to "service_role";

grant truncate on table "public"."lead_stage_history" to "service_role";

grant update on table "public"."lead_stage_history" to "service_role";

grant delete on table "public"."pipeline_stages" to "anon";

grant insert on table "public"."pipeline_stages" to "anon";

grant references on table "public"."pipeline_stages" to "anon";

grant select on table "public"."pipeline_stages" to "anon";

grant trigger on table "public"."pipeline_stages" to "anon";

grant truncate on table "public"."pipeline_stages" to "anon";

grant update on table "public"."pipeline_stages" to "anon";

grant delete on table "public"."pipeline_stages" to "authenticated";

grant insert on table "public"."pipeline_stages" to "authenticated";

grant references on table "public"."pipeline_stages" to "authenticated";

grant select on table "public"."pipeline_stages" to "authenticated";

grant trigger on table "public"."pipeline_stages" to "authenticated";

grant truncate on table "public"."pipeline_stages" to "authenticated";

grant update on table "public"."pipeline_stages" to "authenticated";

grant delete on table "public"."pipeline_stages" to "service_role";

grant insert on table "public"."pipeline_stages" to "service_role";

grant references on table "public"."pipeline_stages" to "service_role";

grant select on table "public"."pipeline_stages" to "service_role";

grant trigger on table "public"."pipeline_stages" to "service_role";

grant truncate on table "public"."pipeline_stages" to "service_role";

grant update on table "public"."pipeline_stages" to "service_role";

grant delete on table "public"."pipelines" to "anon";

grant insert on table "public"."pipelines" to "anon";

grant references on table "public"."pipelines" to "anon";

grant select on table "public"."pipelines" to "anon";

grant trigger on table "public"."pipelines" to "anon";

grant truncate on table "public"."pipelines" to "anon";

grant update on table "public"."pipelines" to "anon";

grant delete on table "public"."pipelines" to "authenticated";

grant insert on table "public"."pipelines" to "authenticated";

grant references on table "public"."pipelines" to "authenticated";

grant select on table "public"."pipelines" to "authenticated";

grant trigger on table "public"."pipelines" to "authenticated";

grant truncate on table "public"."pipelines" to "authenticated";

grant update on table "public"."pipelines" to "authenticated";

grant delete on table "public"."pipelines" to "service_role";

grant insert on table "public"."pipelines" to "service_role";

grant references on table "public"."pipelines" to "service_role";

grant select on table "public"."pipelines" to "service_role";

grant trigger on table "public"."pipelines" to "service_role";

grant truncate on table "public"."pipelines" to "service_role";

grant update on table "public"."pipelines" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."system_settings" to "anon";

grant insert on table "public"."system_settings" to "anon";

grant references on table "public"."system_settings" to "anon";

grant select on table "public"."system_settings" to "anon";

grant trigger on table "public"."system_settings" to "anon";

grant truncate on table "public"."system_settings" to "anon";

grant update on table "public"."system_settings" to "anon";

grant delete on table "public"."system_settings" to "authenticated";

grant insert on table "public"."system_settings" to "authenticated";

grant references on table "public"."system_settings" to "authenticated";

grant select on table "public"."system_settings" to "authenticated";

grant trigger on table "public"."system_settings" to "authenticated";

grant truncate on table "public"."system_settings" to "authenticated";

grant update on table "public"."system_settings" to "authenticated";

grant delete on table "public"."system_settings" to "service_role";

grant insert on table "public"."system_settings" to "service_role";

grant references on table "public"."system_settings" to "service_role";

grant select on table "public"."system_settings" to "service_role";

grant trigger on table "public"."system_settings" to "service_role";

grant truncate on table "public"."system_settings" to "service_role";

grant update on table "public"."system_settings" to "service_role";

grant delete on table "public"."temp_intake_forms" to "anon";

grant insert on table "public"."temp_intake_forms" to "anon";

grant references on table "public"."temp_intake_forms" to "anon";

grant select on table "public"."temp_intake_forms" to "anon";

grant trigger on table "public"."temp_intake_forms" to "anon";

grant truncate on table "public"."temp_intake_forms" to "anon";

grant update on table "public"."temp_intake_forms" to "anon";

grant delete on table "public"."temp_intake_forms" to "authenticated";

grant insert on table "public"."temp_intake_forms" to "authenticated";

grant references on table "public"."temp_intake_forms" to "authenticated";

grant select on table "public"."temp_intake_forms" to "authenticated";

grant trigger on table "public"."temp_intake_forms" to "authenticated";

grant truncate on table "public"."temp_intake_forms" to "authenticated";

grant update on table "public"."temp_intake_forms" to "authenticated";

grant delete on table "public"."temp_intake_forms" to "service_role";

grant insert on table "public"."temp_intake_forms" to "service_role";

grant references on table "public"."temp_intake_forms" to "service_role";

grant select on table "public"."temp_intake_forms" to "service_role";

grant trigger on table "public"."temp_intake_forms" to "service_role";

grant truncate on table "public"."temp_intake_forms" to "service_role";

grant update on table "public"."temp_intake_forms" to "service_role";

grant delete on table "public"."temp_leads_basics" to "anon";

grant insert on table "public"."temp_leads_basics" to "anon";

grant references on table "public"."temp_leads_basics" to "anon";

grant select on table "public"."temp_leads_basics" to "anon";

grant trigger on table "public"."temp_leads_basics" to "anon";

grant truncate on table "public"."temp_leads_basics" to "anon";

grant update on table "public"."temp_leads_basics" to "anon";

grant delete on table "public"."temp_leads_basics" to "authenticated";

grant insert on table "public"."temp_leads_basics" to "authenticated";

grant references on table "public"."temp_leads_basics" to "authenticated";

grant select on table "public"."temp_leads_basics" to "authenticated";

grant trigger on table "public"."temp_leads_basics" to "authenticated";

grant truncate on table "public"."temp_leads_basics" to "authenticated";

grant update on table "public"."temp_leads_basics" to "authenticated";

grant delete on table "public"."temp_leads_basics" to "service_role";

grant insert on table "public"."temp_leads_basics" to "service_role";

grant references on table "public"."temp_leads_basics" to "service_role";

grant select on table "public"."temp_leads_basics" to "service_role";

grant trigger on table "public"."temp_leads_basics" to "service_role";

grant truncate on table "public"."temp_leads_basics" to "service_role";

grant update on table "public"."temp_leads_basics" to "service_role";

grant delete on table "public"."uploaded_documents" to "anon";

grant insert on table "public"."uploaded_documents" to "anon";

grant references on table "public"."uploaded_documents" to "anon";

grant select on table "public"."uploaded_documents" to "anon";

grant trigger on table "public"."uploaded_documents" to "anon";

grant truncate on table "public"."uploaded_documents" to "anon";

grant update on table "public"."uploaded_documents" to "anon";

grant delete on table "public"."uploaded_documents" to "authenticated";

grant insert on table "public"."uploaded_documents" to "authenticated";

grant references on table "public"."uploaded_documents" to "authenticated";

grant select on table "public"."uploaded_documents" to "authenticated";

grant trigger on table "public"."uploaded_documents" to "authenticated";

grant truncate on table "public"."uploaded_documents" to "authenticated";

grant update on table "public"."uploaded_documents" to "authenticated";

grant delete on table "public"."uploaded_documents" to "service_role";

grant insert on table "public"."uploaded_documents" to "service_role";

grant references on table "public"."uploaded_documents" to "service_role";

grant select on table "public"."uploaded_documents" to "service_role";

grant trigger on table "public"."uploaded_documents" to "service_role";

grant truncate on table "public"."uploaded_documents" to "service_role";

grant update on table "public"."uploaded_documents" to "service_role";

grant delete on table "public"."user_notifications" to "anon";

grant insert on table "public"."user_notifications" to "anon";

grant references on table "public"."user_notifications" to "anon";

grant select on table "public"."user_notifications" to "anon";

grant trigger on table "public"."user_notifications" to "anon";

grant truncate on table "public"."user_notifications" to "anon";

grant update on table "public"."user_notifications" to "anon";

grant delete on table "public"."user_notifications" to "authenticated";

grant insert on table "public"."user_notifications" to "authenticated";

grant references on table "public"."user_notifications" to "authenticated";

grant select on table "public"."user_notifications" to "authenticated";

grant trigger on table "public"."user_notifications" to "authenticated";

grant truncate on table "public"."user_notifications" to "authenticated";

grant update on table "public"."user_notifications" to "authenticated";

grant delete on table "public"."user_notifications" to "service_role";

grant insert on table "public"."user_notifications" to "service_role";

grant references on table "public"."user_notifications" to "service_role";

grant select on table "public"."user_notifications" to "service_role";

grant trigger on table "public"."user_notifications" to "service_role";

grant truncate on table "public"."user_notifications" to "service_role";

grant update on table "public"."user_notifications" to "service_role";


  create policy "Allow authenticated users to insert clients"
  on "public"."clients"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "clients_insert_authenticated"
  on "public"."clients"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "clients_select_authenticated"
  on "public"."clients"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow authenticated to view CSR names"
  on "public"."csrs"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "csrs_select_clean"
  on "public"."csrs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can delete templates"
  on "public"."form_templates"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can insert templates"
  on "public"."form_templates"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can update templates"
  on "public"."form_templates"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Authenticated users can read active templates"
  on "public"."form_templates"
  as permissive
  for select
  to public
using (((auth.role() = 'authenticated'::text) AND (is_active = true)));



  create policy "admin_update_all"
  on "public"."profiles"
  as permissive
  for update
  to public
using (public.is_admin());



  create policy "admin_view_all"
  on "public"."profiles"
  as permissive
  for select
  to public
using (public.is_admin());



  create policy "staff_select_clean"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "user_update_own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id));



  create policy "CSR can create intake forms"
  on "public"."temp_intake_forms"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.temp_leads_basics
  WHERE ((temp_leads_basics.id = temp_intake_forms.lead_id) AND (temp_leads_basics.assigned_csr = auth.uid())))));



  create policy "CSR can insert intake forms"
  on "public"."temp_intake_forms"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.temp_leads_basics
  WHERE ((temp_leads_basics.id = temp_intake_forms.lead_id) AND (temp_leads_basics.assigned_csr = auth.uid())))));



  create policy "CSR can read intake forms"
  on "public"."temp_intake_forms"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.temp_leads_basics
  WHERE ((temp_leads_basics.id = temp_intake_forms.lead_id) AND (temp_leads_basics.assigned_csr = auth.uid())))));



  create policy "CSR can update intake forms"
  on "public"."temp_intake_forms"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.temp_leads_basics
  WHERE ((temp_leads_basics.id = temp_intake_forms.lead_id) AND (temp_leads_basics.assigned_csr = auth.uid())))));



  create policy "CSR full access intake forms"
  on "public"."temp_intake_forms"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Client can submit intake form"
  on "public"."temp_intake_forms"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Public can read intake form by link"
  on "public"."temp_intake_forms"
  as permissive
  for select
  to public
using (true);



  create policy "Public read intake form"
  on "public"."temp_intake_forms"
  as permissive
  for select
  to public
using (true);



  create policy "Public submit intake form"
  on "public"."temp_intake_forms"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "allow client submit intake form"
  on "public"."temp_intake_forms"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "allow insert intake form"
  on "public"."temp_intake_forms"
  as permissive
  for insert
  to public
with check (true);



  create policy "Admins and Superadmins view all leads"
  on "public"."temp_leads_basics"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'csr'::text]))))));



  create policy "Agents view own leads"
  on "public"."temp_leads_basics"
  as permissive
  for select
  to public
using (((assigned_csr = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'manager'::text, 'csr'::text])))))));



  create policy "CSR can create leads"
  on "public"."temp_leads_basics"
  as permissive
  for insert
  to authenticated
with check ((assigned_csr = auth.uid()));



  create policy "CSR can insert leads"
  on "public"."temp_leads_basics"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "CSR can read assigned leads"
  on "public"."temp_leads_basics"
  as permissive
  for select
  to authenticated
using ((assigned_csr = auth.uid()));



  create policy "CSR can update assigned leads"
  on "public"."temp_leads_basics"
  as permissive
  for update
  to public
using ((assigned_csr = auth.uid()))
with check ((assigned_csr = auth.uid()));



  create policy "CSR can update own leads"
  on "public"."temp_leads_basics"
  as permissive
  for update
  to authenticated
using ((assigned_csr = auth.uid()));



  create policy "CSR can view own leads"
  on "public"."temp_leads_basics"
  as permissive
  for select
  to authenticated
using ((assigned_csr = auth.uid()));



  create policy "Managers view team leads"
  on "public"."temp_leads_basics"
  as permissive
  for select
  to public
using (((assigned_csr = auth.uid()) OR (assigned_csr IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.manager_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'csr'::text])))))));



  create policy "admin_can_update_leads"
  on "public"."temp_leads_basics"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Only service role can insert notifications"
  on "public"."user_notifications"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "Users can update their own notifications"
  on "public"."user_notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own notifications"
  on "public"."user_notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trg_intake_form_completed AFTER UPDATE OF status ON public.temp_intake_forms FOR EACH ROW EXECUTE FUNCTION public.on_intake_form_completed();

CREATE TRIGGER trg_set_x_date BEFORE INSERT OR UPDATE ON public.temp_leads_basics FOR EACH ROW EXECUTE FUNCTION public.set_x_date();


  create policy "CSR can read final docs"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'final-client-docs'::text));



  create policy "CSR can read intake docs"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'temp-intake-docs'::text));



  create policy "CSR can upload final docs"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'final-client-docs'::text));



  create policy "Client can upload intake docs"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'temp-intake-docs'::text));



