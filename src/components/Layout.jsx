import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';

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
      className="min-h-screen w-full max-w-[600px] mx-auto bg-black text-white relative"
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-black border-b border-neutral-800 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="w-8" />
          <h1 className="text-lg font-bold text-center flex-1">Vibez Citizens</h1>
          <div className="w-8 text-right">{actions}</div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-28">{children}</div>

      {/* Bottom Nav */}
      <BottomNavBar />
    </div>
  );
}
