import headerLogo from "./assets/dbg-header.png";
import footerLogo from "./assets/dbg-footer-logo.png";

export default function DbgShell({ title, subtitle, children, footer }) {
  return (
    <div className="dbgPage">
      <div className="dbgPageInner">
        <div className="dbgGlobalHeaderBar">
          <img className="dbgGlobalHeaderLogo" src={headerLogo} alt="DBG Header" />
        </div>

        <div className="dbgCard dbgCardKiosk">
          <div className="dbgCardBody">
            {(title || subtitle) && (
              <div className="dbgHeader">
                <div className="dbgHeaderText">
                  {title ? <h1 className="dbgTitle">{title}</h1> : null}
                  {subtitle ? <p className="dbgSub">{subtitle}</p> : null}
                </div>
              </div>
            )}

            {children}
          </div>

          {footer ? <div className="dbgCardFooter">{footer}</div> : null}
        </div>

        <div className="dbgGlobalFooterBar">
          <img className="dbgGlobalFooterLogo" src={footerLogo} alt="DBG Footer" />
        </div>
      </div>
    </div>
  );
}