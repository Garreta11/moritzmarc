// hooks/useResponsiveFontSize.ts
import { useState, useEffect } from 'react';

export function useResponsiveFontSize() {
  const [fontSize, setFontSize] = useState(16); // Default size

  useEffect(() => {
    const mapRange = (value, inMin, inMax, outMin, outMax) => {
      return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const clampedWidth = Math.min(Math.max(width, 375), 1024); // clamp between 375 and 1024
      const newSize = mapRange(clampedWidth, 375, 1024, 13.2, 36.4);
      setFontSize(newSize);
    };

    handleResize(); // initial run
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return fontSize;
}
