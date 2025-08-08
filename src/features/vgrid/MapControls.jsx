import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MapControls({ adding, onToggleAdd }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Add / Cancel button */}
      <button
        onClick={onToggleAdd}
        aria-label={adding ? 'Cancel adding location' : 'Add new location'}
        className={`pointer-events-auto absolute top-4 right-4 px-3 py-1 rounded-lg shadow text-white transition-colors duration-200 ${
          adding ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {adding ? 'Cancel' : 'Add'}
      </button>

      {/* Home button */}
      <button
        onClick={() => {
          if (location.pathname !== '/') navigate('/');
        }}
        aria-label="Go to home page"
        className="pointer-events-auto absolute top-4 right-20 bg-white bg-opacity-90 text-black px-3 py-1 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
      >
        Home
      </button>
    </>
  );
}
