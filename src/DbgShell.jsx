// src/components/DbgShell.jsx
import React from "react";

export default function DbgShell({
  title,
  subtitle,
  children,
  footer,
  className = "",
}) {
  return (
    <div className={`dbgPage ${className}`}>
      <div className="dbgPageInner">
        <div className="dbgHeader">
          <div className="dbgLogo" aria-label="DBG" />
          {(title || subtitle) && (
            <div className="dbgHeaderText">
              {title ? <h1 className="dbgTitle">{title}</h1> : null}
              {subtitle ? <p className="dbgSub">{subtitle}</p> : null}
            </div>
          )}
        </div>

        <div className="dbgCard dbgCardKiosk">
          <div className="dbgCardBody">{children}</div>
          {footer ? <div className="dbgCardFooter">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
