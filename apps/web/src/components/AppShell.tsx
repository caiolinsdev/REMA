"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiLogout, apiMe } from "@/lib/api";
import { clearAuthCookies, getStoredToken } from "@/lib/cookies";
import styles from "./AppShell.module.css";

type NavItem = { href: string; label: string };

type Props = {
  area: "aluno" | "professor";
  navItems: NavItem[];
  children: React.ReactNode;
};

export function AppShell({ area, navItems, children }: Props) {
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiMe(token)
      .then((me) => setName(me.name))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    const token = getStoredToken();
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        /* ignora rede */
      }
    }
    clearAuthCookies();
    router.replace("/");
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href={`/${area}`}>REMA</Link>
          <span className={styles.badge}>{area === "aluno" ? "Aluno" : "Professor"}</span>
        </div>
        <nav className={styles.nav} aria-label="Principal">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.user}>
          {name ? <span className={styles.userName}>{name}</span> : null}
          <button type="button" className={styles.logout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
