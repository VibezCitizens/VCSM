begin;

-- Unique constraint: one link per parent-student pair
create unique index if not exists parent_student_links_parent_student_unique
  on learning.parent_student_links (parent_actor_id, student_actor_id);

-- Prevent self-linking
alter table learning.parent_student_links
  drop constraint if exists parent_student_links_no_self_link;
alter table learning.parent_student_links
  add constraint parent_student_links_no_self_link
  check (parent_actor_id != student_actor_id);

-- Trigger: max 2 parents per student
create or replace function learning.enforce_max_parents_per_student()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from learning.parent_student_links
  where student_actor_id = NEW.student_actor_id;

  if v_count >= 2 then
    raise exception 'A student can have at most 2 linked parents. Student actor % already has % parents.',
      NEW.student_actor_id, v_count;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_max_parents on learning.parent_student_links;
create trigger trg_enforce_max_parents
  before insert on learning.parent_student_links
  for each row
  execute function learning.enforce_max_parents_per_student();

-- RLS
alter table learning.parent_student_links enable row level security;

drop policy if exists parent_student_links_select on learning.parent_student_links;
create policy parent_student_links_select
on learning.parent_student_links for select to authenticated
using (
  organization_id in (select learning.current_user_organization_ids())
  or learning.is_current_user_platform_admin()
);

drop policy if exists parent_student_links_insert on learning.parent_student_links;
create policy parent_student_links_insert
on learning.parent_student_links for insert to authenticated
with check (true);

drop policy if exists parent_student_links_delete on learning.parent_student_links;
create policy parent_student_links_delete
on learning.parent_student_links for delete to authenticated
using (learning.is_current_user_platform_admin());

commit;
