import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.badge}>Next.js + Django + React Native</span>
          <h1>REMA — base web com autenticacao (wave 1).</h1>
          <p>
            Entre com uma conta demo para aceder ao shell de aluno ou de professor. A API
            deve estar a correr e os utilizadores criados com{" "}
            <code className={styles.code}>seed_demo_users</code>.
          </p>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>API</h2>
            <p>URL base para integracao.</p>
            <code className={styles.mono}>{apiUrl}</code>
          </article>

          <article className={styles.card}>
            <h2>Aceder</h2>
            <p>Login com email e senha; redirecionamento automatico por papel.</p>
            <Link className={styles.primary} href="/login">
              Entrar
            </Link>
          </article>
        </section>

        <div className={styles.ctas}>
          <a className={styles.secondary} href={`${apiUrl}/health/`}>
            Healthcheck
          </a>
        </div>
      </main>
    </div>
  );
}
