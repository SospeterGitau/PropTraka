
'use client';

import { useState, useRef, useLayoutEffect, useCallback } from 'react';

// This hook is designed to dynamically adjust the font size of a text element
// to fit its container's width.

export const useFitText = () => {
  const [fontSize, setFontSize] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement | null>(null);

  const resize = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const container = element.parentElement;
    if (!container) return;

    // Start with the default font size.
    element.style.fontSize = ''; 

    const containerWidth = container.offsetWidth;
    let elementWidth = element.scrollWidth;

    // Don't do anything if the text already fits
    if (elementWidth <= containerWidth) {
      setFontSize(undefined); // Use default size
      return;
    }

    // Get initial font size to calculate ratio
    const initialFontSize = parseFloat(window.getComputedStyle(element).fontSize);

    // Calculate the new font size ratio
    const ratio = containerWidth / elementWidth;
    const newFontSize = Math.floor(initialFontSize * ratio);
    
    // Set the new font size
    setFontSize(`${newFontSize}px`);

  }, []);

  useLayoutEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  return { fontSize, ref };
};
