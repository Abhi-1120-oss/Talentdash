
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.record_status AS ENUM ('approved', 'pending_review', 'rejected');
CREATE TYPE public.source_platform AS ENUM ('ambitionbox', 'glassdoor', 'manual', 'other');

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX companies_normalized_name_idx ON public.companies(normalized_name);

-- Salary records
CREATE TABLE public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  level_standardized TEXT NOT NULL,
  location TEXT,
  experience_years NUMERIC(4,1) NOT NULL CHECK (experience_years >= 0 AND experience_years <= 50),
  base_salary BIGINT NOT NULL CHECK (base_salary > 0),
  bonus BIGINT NOT NULL DEFAULT 0 CHECK (bonus >= 0),
  stock BIGINT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  total_compensation BIGINT NOT NULL,
  source_platform public.source_platform NOT NULL DEFAULT 'manual',
  source_url TEXT,
  scraped_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status public.record_status NOT NULL DEFAULT 'approved',
  dedup_hash TEXT NOT NULL UNIQUE,
  raw_payload JSONB
);
CREATE INDEX salary_company_role_level_idx ON public.salary_records(company_id, role, level_standardized);
CREATE INDEX salary_status_conf_idx ON public.salary_records(status, confidence_score);
CREATE INDEX salary_role_idx ON public.salary_records(role);

-- Ingestion runs
CREATE TABLE public.ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  scraped INTEGER NOT NULL DEFAULT 0,
  accepted INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  low_confidence INTEGER NOT NULL DEFAULT 0,
  error_summary JSONB
);

-- API keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read companies
CREATE POLICY "companies are public" ON public.companies FOR SELECT USING (true);

-- Approved salary records are public; admins see all
CREATE POLICY "approved salaries are public" ON public.salary_records FOR SELECT
  USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));

-- Admin update salary records
CREATE POLICY "admin can update salaries" ON public.salary_records FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only for ingestion_runs and api_keys
CREATE POLICY "admin reads ingestion runs" ON public.ingestion_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin reads api keys" ON public.api_keys FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: users read own; admins read all
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
