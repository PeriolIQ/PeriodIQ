import { useState, useLayoutEffect, useRef } from 'react';

/**
 * Đo chiều rộng thực tế của một element để vẽ SVG chart nét căng (crisp)
 * và responsive theo container. Trả về [ref, width].
 */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
