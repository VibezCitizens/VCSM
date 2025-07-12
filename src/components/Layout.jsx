import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import TopNav from './TopNav';

export default function Layout({ children, actions }) {
  const navigate = useNavigate();

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigate('/chat'),
    onSwipedRight: () => navigate('/'),
    trackTouch: true,
  });

  return (
    <div
      {...swipeHandlers}
      className="min-h-[100dvh] flex flex-col w-full max-w-[600px] mx-auto bg-black text-white"
    >
      {/* Top Navigation */}
      <TopNav actions={actions} />

      {/* Main Content Area with scroll enabled */}
      <main className="flex-1 overflow-y-auto px-4 pb-28">
        {children || (
          <div className="text-center text-neutral-500 py-10">
            <p>No content to display.</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
}
