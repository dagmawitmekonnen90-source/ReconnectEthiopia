import "./PageHeader.css";

/**
 * Consistent dark-teal page header used across all main public/user pages.
 *
 * Props:
 *   eyebrow    — small uppercase label above the title
 *   title      — main h1
 *   subtitle   — description paragraph (optional)
 *   action     — right-side element: a button/link (optional)
 */
function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </header>
  );
}

export default PageHeader;
