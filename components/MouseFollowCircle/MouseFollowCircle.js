'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './MouseFollowCircle.module.scss';
import gsap from 'gsap';

const MouseFollowCircle = () => {
  const pathname = usePathname();
  const circleRef = useRef(null);

  useEffect(() => {

    if (pathname.includes('/studio')) return;

    const updatePosition = (x, y) => {

      gsap.to(circleRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });

      gsap.to(circleRef.current, {
        top: y,
        left: x,
        duration: 0.1,
        ease: 'none',
      });
    };

    const handleMouseMove = (e) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Don't render the element at all if on /studio
  if (pathname.includes('/studio')) return;

  return (
    <div
      ref={circleRef}
      className={`${styles.circle}`}
      /* style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
      }} */
    />
  );
};

export default MouseFollowCircle;
