"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { apiMe } from "@/lib/api";
import { clearAuthCookies, getStoredToken } from "@/lib/cookies";
import type { Role } from "@rema/contracts";

type Props = {
  expectedRole: Role;
  wrongRoleRedirect: string;
  children: ReactNode;
};

export function RoleGuard({ expectedRole, wrongRoleRedirect, children }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      clearAuthCookies();
      router.replace("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await apiMe(token);
        if (cancelled) return;
        if (me.role !== expectedRole) {
          router.replace(wrongRoleRedirect);
          return;
        }
        setOk(true);
      } catch {
        if (cancelled) return;
        clearAuthCookies();
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expectedRole, wrongRoleRedirect, router]);

  if (!ok) {
    return (
      <div style={{ padding: "2rem", color: "#64748b" }} aria-live="polite">
        Validando sessão...
      </div>
    );
  }

  return <>{children}</>;
}
