import { useNavigate, useLocation } from 'react-router-dom';

export default function TopNav({ actions }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isVoidMode = location.pathname.startsWith('/void');

  return (
    <div className="sticky top-0 z-50 bg-black border-b border-neutral-800 px-4 py-3"> {/* Consistent horizontal padding (px-4) */}
      <div className="flex justify-between items-center">
        {/* Left Placeholder - Ensure it has a consistent width or is flexible if you add items */}
        {/* For now, an empty div to balance the right side if no left items */}
        <div className="w-8"></div> {/* Placeholder to balance the right side's w-8, or adjust based on actual left content */}

        {/* Center Title */}
        <h1 className="text-lg font-bold text-center flex-1">
          {isVoidMode ? 'The Void' : 'Vibez Citizens'}
        </h1>

        {/* Right: 👁️ to enter / 🚪 to exit */}
        <div className="w-8 text-right flex items-center justify-end"> {/* Added flex and justify-end for better control */}
          {isVoidMode ? (
            <button
              onClick={() => navigate('/')}
              title="Exit the Void"
              className="text-white opacity-80 hover:opacity-100 transition focus:outline-none" // Added focus:outline-none for accessibility
            >
              🚪
            </button>
          ) : (
            <button
              onClick={() => navigate('/void')}
              title="Enter the Void"
              className="text-white opacity-60 hover:opacity-100 transition focus:outline-none" // Added focus:outline-none for accessibility
            >
              👁️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}