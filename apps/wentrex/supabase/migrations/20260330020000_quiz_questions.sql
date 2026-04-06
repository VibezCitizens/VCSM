begin;

-- Quiz questions for assignments
create table if not exists learning.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references learning.assignments(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('true_false', 'multiple_choice', 'select_all')),
  points_possible numeric not null default 1 check (points_possible >= 0),
  explanation text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignment_questions_assignment
  on learning.assignment_questions (assignment_id, sort_order);

-- Answer options for each question
create table if not exists learning.assignment_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references learning.assignment_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_options_question
  on learning.assignment_question_options (question_id, sort_order);

-- Add assignment_type to assignments if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'learning' and table_name = 'assignments' and column_name = 'assignment_type'
  ) then
    alter table learning.assignments
      add column assignment_type text not null default 'regular'
      check (assignment_type in ('regular', 'quiz'));
  end if;
end $$;

commit;
