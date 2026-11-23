import { memo, useEffect, useRef } from 'react';
import {
  drawSkinPattern,
  drawVipOuterGlow,
  getDynamicSkinStroke,
  SKIN_MAP,
} from '../game/skins';
import { SkinId, SkinLevel } from '../game/types';

interface SkinPreviewProps {
  skinId: SkinId;
  size?: number;
  skinLevel?: SkinLevel;
  animate?: boolean;
}

export const SkinPreview = memo(function SkinPreview({
  skinId,
  size = 48,
  skinLevel = 1,
  animate = true,
}: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const skin = SKIN_MAP[skinId] || SKIN_MAP.ocean;
    const isAnimatedVip = Boolean(animate && skin.isVip && skinLevel >= 2);
    const radius = skin.isVip && skinLevel >= 2 ? size * 0.34 : size * 0.41;
    const cx = size / 2;
    const cy = size / 2;

    const renderFrame = (timeSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (skin.isVip && skinLevel >= 2) {
        drawVipOuterGlow(ctx, skinId, cx, cy, radius, timeSec, skinLevel);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      drawSkinPattern(ctx, skinId, cx, cy, radius, timeSec, skinLevel);
      ctx.lineWidth = Math.max(1.8, size * 0.05);
      ctx.strokeStyle = getDynamicSkinStroke(skinId, timeSec, skinLevel);
      ctx.stroke();
    };

    if (!isAnimatedVip) {
      renderFrame(0.8);
      return;
    }

    let rafId = 0;
    let lastDraw = 0;
    const startMs = performance.now();

    const tick = (now: number) => {
      if (now - lastDraw >= 34) {
        lastDraw = now;
        renderFrame((now - startMs) * 0.001 + 0.8);
      }
      rafId = requestAnimationFrame(tick);
    };

    renderFrame(0.8);
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [skinId, size, skinLevel, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="block shrink-0"
      aria-hidden="true"
    />
  );
});
