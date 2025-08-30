// src/layouts/RootLayout.jsx
import { Outlet } from "react-router-dom";
import BottomNavBar from "@/ui/components/BottomNavBar";

export default function RootLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black text-white">
      {/* content area; keep space for fixed bottom bar (h-16) + safe-area */}
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* fixed bottom nav */}
      <BottomNavBar />
    </div>
  );
}
