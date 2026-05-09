import { Link } from "react-router-dom";

export default function QuickActionButton({ children, icon: Icon, to, variant = "primary", className = "", ...props }) {
  const classNames = `mt-quick-action mt-quick-action--${variant} ${className}`.trim();
  const content = (
    <>
      {Icon ? <Icon size={16} strokeWidth={2.2} aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );

  if (to) {
    return <Link className={classNames} to={to}>{content}</Link>;
  }

  return <button className={classNames} type="button" {...props}>{content}</button>;
}
