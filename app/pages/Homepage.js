"use client";
import MouseDistortion from "@/components/MouseDistortion/MouseDistortion";
import { PortableText } from '@portabletext/react';
import Link from "next/link";
import styles from "./Homepage.module.scss";

// custom hooks
import { useResponsiveFontSize } from '@/app/hooks/useResponsiveFontSize';
import { useIsMobile } from "@/app/hooks/useIsMobile";


const Homepage = ({ home }) => {
  const fontSize = useResponsiveFontSize();
  const isMobile = useIsMobile();

  return (
    <div className={styles.main}>
      <MouseDistortion videoSrc={isMobile ? home.heromobile : home.hero} />

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