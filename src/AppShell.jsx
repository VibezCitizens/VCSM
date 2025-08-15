import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="bg-black text-white min-h-[100dvh]">
      {/* If you eventually add a header, keep it light and sticky if needed */}
      {/* <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-neutral-800">
        ...
      </header> */}

      {/* Single scroll container for the page content */}
      <main className="vc-screen scroll-y-touch">
        <Outlet />
      </main>
    </div>
  );
}
