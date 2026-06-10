"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isUnauthorizedError } from "@/lib/api";
import {
  getCurrentUserCached,
  hasAuthCache,
} from "@/lib/session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(hasAuthCache());

  useEffect(() => {
    setMounted(true);

    let cancelled = false;

    async function checkSession() {
      try {
        await getCurrentUserCached();

        if (!cancelled) {
          setAllowed(true);
        }
      } catch (err) {
        if (!cancelled && isUnauthorizedError(err)) {
          setAllowed(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (!cancelled) {
          setAllowed(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    }

    if (!hasAuthCache()) {
      checkSession();
    } else {
      setAllowed(true);
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!mounted && !hasAuthCache()) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}