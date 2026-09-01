"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);

    const timer = window.setTimeout(() => {
      setIsReady(true);
    }, 20);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div key={pathname} className={`assetra-page-shell ${isReady ? "is-ready" : ""}`}>
      {children}
    </div>
  );
}
