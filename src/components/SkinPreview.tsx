import { memo, useEffect, useRef } from 'react';
import { drawSkinPattern, SKIN_MAP } from '../game/skins';
import { SkinId } from '../game/types';

interface SkinPreviewProps {
  skinId: SkinId;
  size?: number;
}

export const SkinPreview = memo(function SkinPreview({ skinId, size = 48 }: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.41;
    const skin = SKIN_MAP[skinId] || SKIN_MAP.ocean;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    drawSkinPattern(ctx, skinId, cx, cy, radius, 0.8);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = skin.stroke;
    ctx.stroke();
  }, [skinId, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="block shrink-0"
      aria-hidden="true"
    />
  );
});
