-- Generates sequential 7-digit student login IDs like 2026001, 2026002, etc.
-- Uses the student_login_id_counters table to track the last value per year.

begin;

create or replace function learning.generate_student_login_id()
returns text
language plpgsql
security definer
set search_path = learning
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_next integer;
  v_login_id text;
begin
  -- Atomically increment the counter for this year
  insert into learning.student_login_id_counters (year, last_value, updated_at)
  values (v_year, 1, now())
  on conflict (year) do update
  set
    last_value = learning.student_login_id_counters.last_value + 1,
    updated_at = now()
  returning last_value into v_next;

  -- Build 7-digit ID: 4-digit year prefix + 3-digit sequence (zero-padded)
  v_login_id := v_year::text || lpad(v_next::text, 3, '0');

  return v_login_id;
end;
$$;

grant execute on function learning.generate_student_login_id() to service_role;

commit;
