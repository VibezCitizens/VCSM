-- Extend actor_profiles with school registration fields
begin;

alter table learning.actor_profiles add column if not exists first_name text;
alter table learning.actor_profiles add column if not exists middle_name text;
alter table learning.actor_profiles add column if not exists last_name text;
alter table learning.actor_profiles add column if not exists second_last_name text;
alter table learning.actor_profiles add column if not exists preferred_name text;
alter table learning.actor_profiles add column if not exists sex text check (sex is null or sex in ('male', 'female'));
alter table learning.actor_profiles add column if not exists grade_level text;
alter table learning.actor_profiles add column if not exists section text;
alter table learning.actor_profiles add column if not exists guardian_first_name text;
alter table learning.actor_profiles add column if not exists guardian_last_name text;
alter table learning.actor_profiles add column if not exists guardian_relationship text;
alter table learning.actor_profiles add column if not exists guardian_email text;
alter table learning.actor_profiles add column if not exists guardian_phone text;

commit;
