import styles from "./page.module.scss";
import { getHomepage } from "./utils/sanity-utils";
import { PortableText } from '@portabletext/react';
import MouseDistortion from "@/components/MouseDistortion/MouseDistortion";
import Link from "next/link";

export default async function Home() {
  const home = await getHomepage('singleton-homepage');
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <MouseDistortion videoSrc={home.hero} />

        {/* Desktop */}
        <div className={styles.main__desktop}>
          <div className={styles.main__desktop__wrapper}>
            <div>
              <PortableText value={home.partnershipText} />
            </div>
            <p><Link href={`mailto:${home.email}`}>{home.email}</Link></p>
            <p>{home.slogan}</p>
            <p>{home.location}</p>
          </div>
        </div>

        {/* Mobile */}
        <div className={styles.main__mobile}>
          <div className={styles.main__mobile__wrapper}>
            <PortableText value={home.partnershipText} />
          </div>
          <div className={styles.main__mobile__bottom}>
            <p>{home.slogan}</p>
            <p>{home.location}</p>
            <p><Link href={`mailto:${home.email}`}>{home.email}</Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
