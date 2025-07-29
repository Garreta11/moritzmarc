"use client";
import MouseDistortion from "@/components/MouseDistortion/MouseDistortion";
import { PortableText } from '@portabletext/react';
import Link from "next/link";
import styles from "./Homepage.module.scss";
import { useResponsiveFontSize } from '@/app/hooks/useResponsiveFontSize';


const Homepage = ({ home }) => {
  const fontSize = useResponsiveFontSize();

  return (
    <div className={styles.main}>
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
      <div className={styles.main__mobile} style={{ fontSize: `${fontSize}px` }}>
        <div className={styles.main__mobile__wrapper}>
          <PortableText value={home.partnershipText} />
        </div>
        <div className={styles.main__mobile__bottom}>
          <p>{home.slogan}</p>
          <p>{home.location}</p>
          <p><Link href={`mailto:${home.email}`}>{home.email}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Homepage; 