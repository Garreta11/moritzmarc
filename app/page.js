import styles from "./page.module.scss";
import { getHomepage } from "./utils/sanity-utils";
import { PortableText } from '@portabletext/react';

export default async function Home() {
  const home = await getHomepage('singleton-homepage');
  console.log(home);
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <video src={home.hero} autoPlay muted loop />
        <div className={styles.main__description}>
          <PortableText value={home.description} />
        </div>
      </main>
    </div>
  );
}
