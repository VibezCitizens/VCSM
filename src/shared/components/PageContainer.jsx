// src/ui/components/PageContainer.jsx
export default function PageContainer({ children, className = '' }) {
  // full-bleed on mobile, constrained on >= sm
  return (
    <div className={`w-full max-w-none px-0 sm:max-w-[600px] sm:mx-auto sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
