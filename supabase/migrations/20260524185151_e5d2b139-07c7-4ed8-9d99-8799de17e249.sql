
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO service_role;

-- Recreate policies to use private.has_role
DROP POLICY "approved salaries are public" ON public.salary_records;
DROP POLICY "admin can update salaries" ON public.salary_records;
DROP POLICY "admin reads ingestion runs" ON public.ingestion_runs;
DROP POLICY "admin reads api keys" ON public.api_keys;
DROP POLICY "users read own roles" ON public.user_roles;

CREATE POLICY "approved salaries are public" ON public.salary_records FOR SELECT
  USING (status = 'approved' OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin can update salaries" ON public.salary_records FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin reads ingestion runs" ON public.ingestion_runs FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin reads api keys" ON public.api_keys FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP FUNCTION public.has_role(UUID, public.app_role);
