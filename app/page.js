import styles from "./page.module.scss";
import { getHomepage } from "./utils/sanity-utils";
import Homepage from "./pages/Homepage";

export default async function Home() {
  const home = await getHomepage('singleton-homepage');
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Homepage home={home} />
      </main>
    </div>
  );
}
