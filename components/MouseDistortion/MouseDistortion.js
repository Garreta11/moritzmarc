"use client";
import { useRef, useEffect } from "react";
import Experience from "./Experience";
import styles from "./MouseDistortion.module.scss";

const MouseDistortion = ({ videoSrc }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const experience = new Experience(containerRef.current, videoSrc || null);
    return () => {
      experience.destroy();
    };
  }, [videoSrc]);

  return (
    <div ref={containerRef} className={styles.canvas}></div>
  );
};

export default MouseDistortion;