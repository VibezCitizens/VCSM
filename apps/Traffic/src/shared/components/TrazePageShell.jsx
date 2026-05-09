export function TrazePageShell({ children, className }) {
  const base = "homepage homepage--immersive traze-public-screen";
  return (
    <div className={className ? `${base} ${className}` : base}>
      {children}
    </div>
  );
}
