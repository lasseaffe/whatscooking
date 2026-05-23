'use client';
import { useEffect, useState, useCallback } from 'react';

const FALLBACK = 'rgba(10,5,3,1)';
const SAMPLE_SIZE = 20;
const DEBOUNCE_MS = 200;

function getDominantColor(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return FALLBACK;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] + data[i + 1] + data[i + 2] < 30) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    if (count === 0) return FALLBACK;
    const br = Math.round(r / count * 0.12 + 10);
    const bg = Math.round(g / count * 0.06 + 5);
    const bb = Math.round(b / count * 0.04 + 3);
    return `rgba(${br},${bg},${bb},1)`;
  } catch {
    return FALLBACK;
  }
}

export function useAmbilight(imageUrl: string | null, enabled: boolean): string {
  const [color, setColor] = useState(FALLBACK);

  const sample = useCallback(() => {
    if (!enabled || !imageUrl) { setColor(FALLBACK); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setColor(getDominantColor(img));
    img.onerror = () => setColor(FALLBACK);
    img.src = imageUrl;
  }, [imageUrl, enabled]);

  useEffect(() => {
    const timer = setTimeout(sample, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [sample]);

  return color;
}
