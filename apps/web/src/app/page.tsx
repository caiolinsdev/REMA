import styles from "./page.module.css";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.badge}>Next.js + Django + React Native</span>
          <h1>Base web pronta para iniciar o projeto REMA.</h1>
          <p>
            Esta aplicacao serve como ponto de partida da versao web e ja esta
            preparada para conversar com a API configurada no ambiente local.
          </p>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>API configurada</h2>
            <p>URL base esperada para integracao entre frontend e backend.</p>
            <code>{apiUrl}</code>
          </article>

          <article className={styles.card}>
            <h2>Proximo passo</h2>
            <p>
              Definir o dominio do produto, os fluxos principais e os primeiros
              contratos de negocio.
            </p>
          </article>
        </section>

        <div className={styles.ctas}>
          <a className={styles.primary} href={`${apiUrl}/health/`}>
            Ver healthcheck da API
          </a>
          <a className={styles.secondary} href="https://nextjs.org/docs">
            Documentacao Next.js
          </a>
        </div>
      </main>
    </div>
  );
}
