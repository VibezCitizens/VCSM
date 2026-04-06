-- Backfill actor_access for students who were created without it.
-- Students are actors that have course_memberships with role='student'
-- but may not have organization_memberships (they aren't org members).

INSERT INTO learning.actor_access (actor_id, can_access_learning_center)
SELECT DISTINCT a.id, true
FROM learning.actors a
WHERE a.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM learning.actor_access aa WHERE aa.actor_id = a.id
  )
ON CONFLICT (actor_id) DO NOTHING;
