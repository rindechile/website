import { useEffect, useState, RefObject } from 'react';

export function useResponsiveDimensions(containerRef: RefObject<HTMLDivElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Responsive height based on screen size
        const height = window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 350 : 400;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  return dimensions;
}
