import { Bell, Command, Search, UserRound } from "lucide-react";
import QuickActionButton from "@/features/dashboard/mine-transfer/components/QuickActionButton";

export default function HeaderBar() {
  return (
    <header className="mt-headerbar">
      <label className="mt-command-search">
        <Search size={17} strokeWidth={2.1} aria-hidden="true" />
        <input aria-label="Search dashboard" placeholder="Search platforms, providers, cities, and signals" type="search" />
        <span><Command size={13} /> K</span>
      </label>

      <div className="mt-headerbar__actions">
        <button className="mt-icon-button" type="button" aria-label="Notifications placeholder">
          <Bell size={18} strokeWidth={2.1} />
          <span aria-hidden="true" />
        </button>
        <QuickActionButton icon={UserRound} variant="secondary">Profile</QuickActionButton>
      </div>
    </header>
  );
}
