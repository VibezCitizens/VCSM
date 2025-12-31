// src/ui/components/PageContainer.jsx
export default function PageContainer({ children, className = '' }) {
  return (
    <div
      className={`
        h-full min-h-0
        w-full max-w-none
        px-0
        sm:max-w-[600px] sm:mx-auto sm:px-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
