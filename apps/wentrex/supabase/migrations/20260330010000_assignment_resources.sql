-- Add resource fields to assignments for teacher-uploaded content
begin;

alter table learning.assignments add column if not exists resource_url text;
alter table learning.assignments add column if not exists attachment_path text;
alter table learning.assignments add column if not exists attachment_name text;
alter table learning.assignments add column if not exists attachment_size bigint;
alter table learning.assignments add column if not exists attachment_mime text;

commit;
