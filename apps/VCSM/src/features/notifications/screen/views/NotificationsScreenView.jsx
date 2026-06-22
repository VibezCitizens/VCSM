import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useNotificationInbox } from "../../inbox/hooks/useNotificationInbox";
import { useNotificationsHeader } from "../../inbox/hooks/useNotificationsHeader";
import NotificationsView from "../../inbox/ui/Notifications.view";
import NotificationsHeader from "../../inbox/ui/NotificationsHeader.view";
import MyAppointmentsView from "./MyAppointmentsView";
import "@/shared/styles/modern/module-modern.css";
import "@/shared/styles/profiles-modern.css";
import "@/features/notifications/styles/notifications-modern.css";

const VALID_VIEWS = new Set(["notifications", "appointments"]);

export default function NotificationsScreenView() {
  const { identity } = useIdentity();
  const [searchParams, setSearchParams] = useSearchParams();

  const isCitizen = identity?.kind === "user";
  const citizenActorId = isCitizen ? identity.actorId : null;

  const activeSection = useMemo(() => {
    const param = searchParams.get("view");
    if (!isCitizen) return "notifications";
    return VALID_VIEWS.has(param) ? param : "notifications";
  }, [searchParams, isCitizen]);

  function handleSectionChange(key) {
    if (!isCitizen) return;
    setSearchParams(key === "notifications" ? {} : { view: key }, { replace: true });
  }

  const listState = useNotificationInbox();
  const headerState = useNotificationsHeader(identity?.actorId ?? null);

  return (
    <div className="profiles-modern notifications-modern-page">
      <div className="notifications-modern-shell">
        <NotificationsHeader
          unreadCount={headerState.unreadCount}
          onMarkAllSeen={headerState.markAllSeen}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          showAppointments={isCitizen}
        />

        {activeSection === "appointments" ? (
          <MyAppointmentsView actorId={citizenActorId} />
        ) : (
          <NotificationsView {...listState} />
        )}
      </div>
    </div>
  );
}
