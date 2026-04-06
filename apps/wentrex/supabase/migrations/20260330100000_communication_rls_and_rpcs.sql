-- ============================================================
-- Communication Module: RLS Policies + Helper RPCs
-- ============================================================

-- Helper: check if current actor is an active member of a conversation
CREATE OR REPLACE FUNCTION learning.is_conversation_member(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth, learning
AS $$
  SELECT EXISTS (
    SELECT 1 FROM learning.communication_conversation_members
    WHERE conversation_id = _conversation_id
      AND actor_id = learning.current_actor_id()
      AND is_active = true
  );
$$;

-- Helper: check if current actor is admin/owner in a conversation
CREATE OR REPLACE FUNCTION learning.is_conversation_admin(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth, learning
AS $$
  SELECT EXISTS (
    SELECT 1 FROM learning.communication_conversation_members
    WHERE conversation_id = _conversation_id
      AND actor_id = learning.current_actor_id()
      AND is_active = true
      AND role IN ('owner', 'admin')
  );
$$;

-- ── Enable RLS ──────────────────────────────────────────────
ALTER TABLE learning.communication_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_inbox_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.communication_message_moderation_actions ENABLE ROW LEVEL SECURITY;

-- ── communication_conversations ─────────────────────────────
CREATE POLICY conv_select_member ON learning.communication_conversations
FOR SELECT USING (learning.is_conversation_member(id));

CREATE POLICY conv_insert_auth ON learning.communication_conversations
FOR INSERT WITH CHECK (
  learning.can_current_user_access_learning_center()
  AND created_by_actor_id = learning.current_actor_id()
);

CREATE POLICY conv_update_admin ON learning.communication_conversations
FOR UPDATE USING (learning.is_conversation_admin(id));

-- ── communication_conversation_members ──────────────────────
CREATE POLICY members_select ON learning.communication_conversation_members
FOR SELECT USING (learning.is_conversation_member(conversation_id));

CREATE POLICY members_insert ON learning.communication_conversation_members
FOR INSERT WITH CHECK (
  learning.is_conversation_admin(conversation_id)
  OR actor_id = learning.current_actor_id()
);

CREATE POLICY members_update_own ON learning.communication_conversation_members
FOR UPDATE USING (
  actor_id = learning.current_actor_id()
  OR learning.is_conversation_admin(conversation_id)
);

-- ── communication_messages ──────────────────────────────────
CREATE POLICY msg_select_member ON learning.communication_messages
FOR SELECT USING (learning.is_conversation_member(conversation_id));

CREATE POLICY msg_insert_member ON learning.communication_messages
FOR INSERT WITH CHECK (
  sender_actor_id = learning.current_actor_id()
  AND learning.is_conversation_member(conversation_id)
);

CREATE POLICY msg_update_sender ON learning.communication_messages
FOR UPDATE USING (
  sender_actor_id = learning.current_actor_id()
  OR learning.is_conversation_admin(conversation_id)
);

-- ── communication_inbox_entries ──────────────────────────────
CREATE POLICY inbox_select_own ON learning.communication_inbox_entries
FOR SELECT USING (actor_id = learning.current_actor_id());

CREATE POLICY inbox_insert ON learning.communication_inbox_entries
FOR INSERT WITH CHECK (
  actor_id = learning.current_actor_id()
  OR learning.is_conversation_admin(conversation_id)
);

CREATE POLICY inbox_update_own ON learning.communication_inbox_entries
FOR UPDATE USING (actor_id = learning.current_actor_id());

CREATE POLICY inbox_delete_own ON learning.communication_inbox_entries
FOR DELETE USING (actor_id = learning.current_actor_id());

-- ── communication_message_attachments ───────────────────────
CREATE POLICY attach_select ON learning.communication_message_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM learning.communication_messages m
    WHERE m.id = message_id
      AND learning.is_conversation_member(m.conversation_id)
  )
);

CREATE POLICY attach_insert ON learning.communication_message_attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM learning.communication_messages m
    WHERE m.id = message_id
      AND m.sender_actor_id = learning.current_actor_id()
  )
);

-- ── communication_message_receipts ──────────────────────────
CREATE POLICY receipts_select_own ON learning.communication_message_receipts
FOR SELECT USING (actor_id = learning.current_actor_id());

CREATE POLICY receipts_insert_own ON learning.communication_message_receipts
FOR INSERT WITH CHECK (
  actor_id = learning.current_actor_id()
  AND EXISTS (
    SELECT 1 FROM learning.communication_messages m
    WHERE m.id = message_id
      AND learning.is_conversation_member(m.conversation_id)
  )
);

CREATE POLICY receipts_update_own ON learning.communication_message_receipts
FOR UPDATE USING (actor_id = learning.current_actor_id());

-- ── communication_message_moderation_actions ────────────────
CREATE POLICY mod_select ON learning.communication_message_moderation_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM learning.communication_messages m
    WHERE m.id = message_id
      AND learning.is_conversation_admin(m.conversation_id)
  )
);

CREATE POLICY mod_insert ON learning.communication_message_moderation_actions
FOR INSERT WITH CHECK (
  actor_id = learning.current_actor_id()
  AND EXISTS (
    SELECT 1 FROM learning.communication_messages m
    WHERE m.id = message_id
      AND learning.is_conversation_admin(m.conversation_id)
  )
);

-- ============================================================
-- RPC: Get messageable contacts for current user
-- Returns actors the current user is allowed to message
-- ============================================================
CREATE OR REPLACE FUNCTION learning.get_messageable_contacts()
RETURNS TABLE (
  actor_id uuid,
  full_name text,
  role text,
  context text,
  context_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth, learning
AS $$
DECLARE
  v_actor_id uuid;
  v_org_id uuid;
  v_is_admin boolean := false;
  v_is_staff boolean := false;
  v_is_teacher boolean := false;
  v_is_student boolean := false;
  v_is_parent boolean := false;
BEGIN
  v_actor_id := learning.current_actor_id();
  IF v_actor_id IS NULL THEN RETURN; END IF;

  SELECT a.organization_id INTO v_org_id
  FROM learning.actors a WHERE a.id = v_actor_id;

  -- Determine caller roles
  SELECT
    EXISTS (SELECT 1 FROM learning.organization_memberships om WHERE om.actor_id = v_actor_id AND om.status = 'active' AND om.role IN ('owner','admin')),
    EXISTS (SELECT 1 FROM learning.organization_memberships om WHERE om.actor_id = v_actor_id AND om.status = 'active' AND om.role = 'staff'),
    EXISTS (SELECT 1 FROM learning.organization_memberships om WHERE om.actor_id = v_actor_id AND om.status = 'active' AND om.role = 'teacher'),
    EXISTS (SELECT 1 FROM learning.course_memberships cm WHERE cm.actor_id = v_actor_id AND cm.role = 'student' AND cm.status = 'active'),
    EXISTS (SELECT 1 FROM learning.parent_student_links psl WHERE psl.parent_actor_id = v_actor_id)
  INTO v_is_admin, v_is_staff, v_is_teacher, v_is_student, v_is_parent;

  -- Admin/Owner can message all staff and teachers in their org
  IF v_is_admin THEN
    RETURN QUERY
    SELECT DISTINCT om.actor_id, COALESCE(ap.full_name, 'Unknown'), om.role, 'organization'::text, v_org_id
    FROM learning.organization_memberships om
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = om.actor_id
    WHERE om.organization_id = v_org_id AND om.status = 'active'
      AND om.actor_id != v_actor_id;
  END IF;

  -- Staff can message admin/owner in their org
  IF v_is_staff THEN
    RETURN QUERY
    SELECT DISTINCT om.actor_id, COALESCE(ap.full_name, 'Unknown'), om.role, 'organization'::text, v_org_id
    FROM learning.organization_memberships om
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = om.actor_id
    WHERE om.organization_id = v_org_id AND om.status = 'active'
      AND om.role IN ('owner','admin')
      AND om.actor_id != v_actor_id;
  END IF;

  -- Teacher can message parents of their students + students in their courses
  IF v_is_teacher THEN
    -- Parents of students in teacher's courses
    RETURN QUERY
    SELECT DISTINCT psl.parent_actor_id, COALESCE(ap.full_name, 'Unknown'), 'parent'::text, 'parent_teacher'::text, psl.student_actor_id
    FROM learning.course_memberships tcm
    JOIN learning.course_memberships scm ON scm.course_id = tcm.course_id AND scm.role = 'student' AND scm.status = 'active'
    JOIN learning.parent_student_links psl ON psl.student_actor_id = scm.actor_id
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = psl.parent_actor_id
    WHERE tcm.actor_id = v_actor_id AND tcm.role = 'teacher' AND tcm.status = 'active';

    -- Students in teacher's courses (for direct chat)
    RETURN QUERY
    SELECT DISTINCT scm.actor_id, COALESCE(ap.full_name, 'Unknown'), 'student'::text, 'course'::text, scm.course_id
    FROM learning.course_memberships tcm
    JOIN learning.course_memberships scm ON scm.course_id = tcm.course_id AND scm.role = 'student' AND scm.status = 'active'
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = scm.actor_id
    WHERE tcm.actor_id = v_actor_id AND tcm.role = 'teacher' AND tcm.status = 'active'
      AND scm.actor_id != v_actor_id;
  END IF;

  -- Student can message their teachers
  IF v_is_student THEN
    RETURN QUERY
    SELECT DISTINCT tcm.actor_id, COALESCE(ap.full_name, pp.display_name, 'Unknown'), 'teacher'::text, 'course'::text, tcm.course_id
    FROM learning.course_memberships scm
    JOIN learning.course_memberships tcm ON tcm.course_id = scm.course_id AND tcm.role = 'teacher' AND tcm.status = 'active'
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = tcm.actor_id
    LEFT JOIN learning.actors ta ON ta.id = tcm.actor_id
    LEFT JOIN public.profiles pp ON pp.id = ta.user_id
    WHERE scm.actor_id = v_actor_id AND scm.role = 'student' AND scm.status = 'active'
      AND tcm.actor_id != v_actor_id;
  END IF;

  -- Parent can message teachers of their children's courses
  IF v_is_parent THEN
    RETURN QUERY
    SELECT DISTINCT tcm.actor_id, COALESCE(ap.full_name, pp.display_name, 'Unknown'), 'teacher'::text, 'parent_teacher'::text, psl.student_actor_id
    FROM learning.parent_student_links psl
    JOIN learning.course_memberships scm ON scm.actor_id = psl.student_actor_id AND scm.role = 'student' AND scm.status = 'active'
    JOIN learning.course_memberships tcm ON tcm.course_id = scm.course_id AND tcm.role = 'teacher' AND tcm.status = 'active'
    LEFT JOIN learning.actor_profiles ap ON ap.actor_id = tcm.actor_id
    LEFT JOIN learning.actors ta ON ta.id = tcm.actor_id
    LEFT JOIN public.profiles pp ON pp.id = ta.user_id
    WHERE psl.parent_actor_id = v_actor_id
      AND tcm.actor_id != v_actor_id;
  END IF;

  RETURN;
END;
$$;

-- ============================================================
-- RPC: Create or get direct conversation between two actors
-- Enforces relationship-based access control
-- ============================================================
CREATE OR REPLACE FUNCTION learning.get_or_create_direct_conversation(p_to_actor_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, learning
AS $$
DECLARE
  v_actor_id uuid;
  v_org_id uuid;
  v_realm_id uuid;
  v_conv_id uuid;
  v_is_allowed boolean := false;
BEGIN
  v_actor_id := learning.current_actor_id();
  IF v_actor_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_actor_id = p_to_actor_id THEN RAISE EXCEPTION 'Cannot message yourself'; END IF;

  SELECT a.organization_id INTO v_org_id FROM learning.actors a WHERE a.id = v_actor_id;
  SELECT o.realm_id INTO v_realm_id FROM learning.organizations o WHERE o.id = v_org_id;

  -- Check if target is in same org
  IF NOT EXISTS (SELECT 1 FROM learning.actors a WHERE a.id = p_to_actor_id AND a.organization_id = v_org_id AND a.is_active = true) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Check relationship-based access (via get_messageable_contacts)
  IF EXISTS (
    SELECT 1 FROM learning.get_messageable_contacts() mc WHERE mc.actor_id = p_to_actor_id
  ) THEN
    v_is_allowed := true;
  END IF;

  IF NOT v_is_allowed THEN
    RAISE EXCEPTION 'Not authorized to message this user';
  END IF;

  -- Check for existing direct conversation
  SELECT cm1.conversation_id INTO v_conv_id
  FROM learning.communication_conversation_members cm1
  JOIN learning.communication_conversation_members cm2 ON cm2.conversation_id = cm1.conversation_id
  JOIN learning.communication_conversations c ON c.id = cm1.conversation_id
  WHERE cm1.actor_id = v_actor_id AND cm1.is_active = true
    AND cm2.actor_id = p_to_actor_id AND cm2.is_active = true
    AND c.conversation_type = 'direct' AND c.is_group = false
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO learning.communication_conversations (
    realm_id, organization_id, conversation_type, is_group, created_by_actor_id
  ) VALUES (
    v_realm_id, v_org_id, 'direct', false, v_actor_id
  ) RETURNING id INTO v_conv_id;

  -- Add members
  INSERT INTO learning.communication_conversation_members (conversation_id, actor_id, role, can_post, can_manage)
  VALUES
    (v_conv_id, v_actor_id, 'owner', true, true),
    (v_conv_id, p_to_actor_id, 'member', true, false);

  -- Create inbox entries
  INSERT INTO learning.communication_inbox_entries (conversation_id, actor_id, folder)
  VALUES
    (v_conv_id, v_actor_id, 'inbox'),
    (v_conv_id, p_to_actor_id, 'inbox');

  RETURN v_conv_id;
END;
$$;

-- ============================================================
-- RPC: Create or get course group conversation
-- ============================================================
CREATE OR REPLACE FUNCTION learning.get_or_create_course_conversation(p_course_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, learning
AS $$
DECLARE
  v_actor_id uuid;
  v_conv_id uuid;
  v_course record;
  r record;
BEGIN
  v_actor_id := learning.current_actor_id();
  IF v_actor_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Check caller is teacher or admin of this course's org
  SELECT c.id, c.organization_id, c.realm_id, c.title INTO v_course
  FROM learning.courses c WHERE c.id = p_course_id;

  IF v_course IS NULL THEN RAISE EXCEPTION 'Course not found'; END IF;

  -- Check for existing course conversation
  SELECT id INTO v_conv_id FROM learning.communication_conversations
  WHERE course_id = p_course_id AND conversation_type = 'course' AND is_archived = false
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN RETURN v_conv_id; END IF;

  -- Create course conversation
  INSERT INTO learning.communication_conversations (
    realm_id, organization_id, course_id, conversation_type, is_group,
    title, created_by_actor_id
  ) VALUES (
    v_course.realm_id, v_course.organization_id, p_course_id, 'course', true,
    v_course.title, v_actor_id
  ) RETURNING id INTO v_conv_id;

  -- Add all course members
  FOR r IN
    SELECT cm.actor_id, cm.role FROM learning.course_memberships cm
    WHERE cm.course_id = p_course_id AND cm.status = 'active'
  LOOP
    INSERT INTO learning.communication_conversation_members (
      conversation_id, actor_id, role, can_post, can_manage
    ) VALUES (
      v_conv_id, r.actor_id,
      CASE WHEN r.role = 'teacher' THEN 'owner' ELSE 'member' END,
      true,
      r.role = 'teacher'
    ) ON CONFLICT DO NOTHING;

    INSERT INTO learning.communication_inbox_entries (conversation_id, actor_id, folder)
    VALUES (v_conv_id, r.actor_id, 'inbox')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_conv_id;
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION learning.is_conversation_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION learning.is_conversation_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION learning.get_messageable_contacts() TO authenticated;
GRANT EXECUTE ON FUNCTION learning.get_or_create_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION learning.get_or_create_course_conversation(uuid) TO authenticated;
