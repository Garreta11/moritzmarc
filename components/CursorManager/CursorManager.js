'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const CursorManager = () => {
  const pathname = usePathname();
  
  useEffect(() => {
    if (pathname.includes('/studio')) {
      console.log(pathname)
      document.body.style.setProperty('cursor', 'initial', 'important');
    } else {
      document.body.style.cursor = 'none';
    }
  }, [pathname]);

  return null;
};

export default CursorManager;
