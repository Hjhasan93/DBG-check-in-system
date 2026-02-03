import { useEffect } from "react";

export default function KioskLock() {
  useEffect(() => {
    // Disable right-click context menu
    const onContextMenu = (e) => e.preventDefault();

    // Block common refresh / dev shortcuts in kiosk
    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase();

      // Block refresh: F5, Ctrl+R, Cmd+R
      if (key === "f5") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && key === "r") e.preventDefault();

      // Block opening devtools: F12, Ctrl+Shift+I, Cmd+Opt+I
      if (key === "f12") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "i") e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);

    // Prevent page scroll bounce on kiosk screens
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return null;
}
