/* eslint-disable react-refresh/only-export-components */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import LearningErrorState from "@/learning/administration/components/shared/LearningErrorState";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import { useLearningHome } from "@/learning/administration/hooks/shared/useLearningHome";
import { useLearningRouteContext } from "@/learning/administration/hooks/shared/useLearningRouteContext";

function getCourseId(item) {
  return item?.course?.id ?? item?.id ?? null;
}

function getOrganizationId(item) {
  return item?.organization?.id ?? item?.id ?? null;
}

function RuntimeError({ error, onRetry }) {
  return <LearningErrorState error={error} onRetry={onRetry} />;
}

export function ScreenRoute({ Screen, buildProps }) {
  const navigate = useNavigate();
  const params = useParams();
  const learning = useLearningRouteContext();

  if (learning.isLoading) {
    return <LearningLoadingState label="Loading..." variant="home" />;
  }

  if (learning.error) {
    return <RuntimeError error={learning.error} onRetry={learning.reload} />;
  }

  if (!learning.isReady) {
    return (
      <RuntimeError
        error={{
          code: "LEARNING_CONTEXT_UNAVAILABLE",
          message: "Learning context is unavailable.",
        }}
        onRetry={learning.reload}
      />
    );
  }

  return (
    <Screen
      {...learning}
      {...params}
      {...buildProps?.({ navigate, params })}
    />
  );
}

export function LearningHomeRoute({ Screen }) {
  const learning = useLearningRouteContext();

  const homeState = useLearningHome({
    supabase: learning.supabase,
    actorId: learning.actorId,
    realmId: learning.realmId,
    enabled: learning.isReady,
  });

  if (learning.isLoading || (learning.isReady && homeState.isLoading && !homeState.data)) {
    return <LearningLoadingState label="Loading learning..." variant="home" />;
  }

  if (learning.error) {
    return <RuntimeError error={learning.error} onRetry={learning.reload} />;
  }

  if (!learning.isReady) {
    return (
      <RuntimeError
        error={{
          code: "LEARNING_CONTEXT_UNAVAILABLE",
          message: "Learning context is unavailable.",
        }}
        onRetry={learning.reload}
      />
    );
  }

  if (homeState.error && !homeState.data) {
    return <RuntimeError error={homeState.error} onRetry={homeState.reload} />;
  }

  return (
    <Screen
      {...learning}
      courses={homeState.data?.courses ?? []}
      groupedCourses={homeState.data?.groupedCourses ?? {}}
      summary={homeState.data?.summary ?? {}}
      realm={homeState.data?.realm ?? learning.realm}
      reload={homeState.reload}
      organizations={homeState.data?.organizations ?? []}
    />
  );
}

export { getCourseId, getOrganizationId };
