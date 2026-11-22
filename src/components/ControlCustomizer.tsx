import { useState } from 'react';
import {
  Check,
  FlipHorizontal2,
  Flame,
  Gamepad2,
  Map as MapIcon,
  Move,
  RotateCcw,
  Scissors,
  ZoomIn,
  Zap,
} from 'lucide-react';
import { clampControlPoint, DEFAULT_CONTROL_LAYOUT } from '../game/controlLayout';
import { Translations } from '../game/i18n';
import { ControlLayout } from '../game/types';

type DraggableControlKey = 'joystick' | 'split' | 'eject' | 'fastEject' | 'zoom' | 'minimap';

interface ControlCustomizerProps {
  open: boolean;
  layout: ControlLayout;
  t: Translations;
  onChangeLayout: (next: ControlLayout) => void;
  onClose: () => void;
}

export function ControlCustomizer({
  open,
  layout,
  t,
  onChangeLayout,
  onClose,
}: ControlCustomizerProps) {
  const [draggingKey, setDraggingKey] = useState<DraggableControlKey | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  if (!open) return null;

  const handleStartDrag = (key: DraggableControlKey, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const currentCenterX = layout[key].xPct * w;
    const currentCenterY = layout[key].yPct * h;

    setDraggingKey(key);
    setDragOffset({
      dx: e.clientX - currentCenterX,
      dy: e.clientY - currentCenterY,
    });
  };

  const handleMoveDrag = (key: DraggableControlKey, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingKey !== key) return;
    e.preventDefault();
    e.stopPropagation();

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const targetX = (e.clientX - dragOffset.dx) / w;
    const targetY = (e.clientY - dragOffset.dy) / h;

    const clamped = clampControlPoint({ xPct: targetX, yPct: targetY });
    onChangeLayout({
      ...layout,
      [key]: clamped,
    });
  };

  const handleEndDrag = (key: DraggableControlKey, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingKey !== key) return;
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
    setDraggingKey(null);
  };

  const handleFlipHorizontal = () => {
    onChangeLayout({
      ...layout,
      joystick: clampControlPoint({ xPct: 1 - layout.joystick.xPct, yPct: layout.joystick.yPct }),
      split: clampControlPoint({ xPct: 1 - layout.split.xPct, yPct: layout.split.yPct }),
      eject: clampControlPoint({ xPct: 1 - layout.eject.xPct, yPct: layout.eject.yPct }),
      fastEject: clampControlPoint({
        xPct: 1 - layout.fastEject.xPct,
        yPct: layout.fastEject.yPct,
      }),
      zoom: clampControlPoint({ xPct: 1 - layout.zoom.xPct, yPct: layout.zoom.yPct }),
      minimap: clampControlPoint({ xPct: 1 - layout.minimap.xPct, yPct: layout.minimap.yPct }),
    });
  };

  const handleReset = () => {
    onChangeLayout(DEFAULT_CONTROL_LAYOUT);
  };

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px]">
      {/* Subtle alignment crosshair */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-white/20" />
        <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-white/20" />
      </div>

      {/* Top Floating Control Bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center p-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 [@media(max-height:520px)]:p-1.5">
        <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-white/55 bg-white/90 p-3 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-4 [@media(max-height:520px)]:p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                {t.customizeTitle}
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 sm:text-xs [@media(max-height:520px)]:hidden">
                {t.customizeHint}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-700 active:scale-95 whitespace-nowrap [@media(max-height:520px)]:min-h-[36px] [@media(max-height:520px)]:py-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{t.saveLayoutBtn}</span>
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-800 [@media(max-height:520px)]:mt-1.5 [@media(max-height:520px)]:pt-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeLayout({
                  ...layout,
                  showJoystick: !layout.showJoystick,
                })
              }
              className={`flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                layout.showJoystick
                  ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:border-sky-400 dark:text-sky-200'
                  : 'border-slate-200 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>{t.showJoystickLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleFlipHorizontal}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              <FlipHorizontal2 className="h-4 w-4" />
              <span>{t.flipLayoutBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.resetLayoutBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Physical Coordinate Draggable Layer */}
      <div dir="ltr" className="pointer-events-none fixed inset-0 z-30">
        {/* Draggable Joystick Pad */}
        <div
          onPointerDown={(e) => handleStartDrag('joystick', e)}
          onPointerMove={(e) => handleMoveDrag('joystick', e)}
          onPointerUp={(e) => handleEndDrag('joystick', e)}
          onPointerCancel={(e) => handleEndDrag('joystick', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.joystick.xPct * 100}%`,
            top: `${layout.joystick.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex h-24 w-24 cursor-grab touch-none select-none flex-col items-center justify-center rounded-full border-2 border-dashed transition-transform active:cursor-grabbing sm:h-28 sm:w-28 [@media(max-height:520px)]:h-20 [@media(max-height:520px)]:w-20 ${
            draggingKey === 'joystick'
              ? 'scale-105 border-sky-400 bg-sky-500/30 ring-4 ring-sky-400/30'
              : 'border-white/80 bg-white/35 dark:border-slate-400/70 dark:bg-slate-900/50'
          } ${!layout.showJoystick ? 'opacity-40' : ''}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/80 text-white shadow-md">
            <Move className="h-4 w-4" />
          </div>
          <span className="mt-1 text-[10px] font-bold text-slate-900 dark:text-white">
            {t.joystickLabel}
          </span>
        </div>

        {/* Draggable Split Button */}
        <div
          onPointerDown={(e) => handleStartDrag('split', e)}
          onPointerMove={(e) => handleMoveDrag('split', e)}
          onPointerUp={(e) => handleEndDrag('split', e)}
          onPointerCancel={(e) => handleEndDrag('split', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.split.xPct * 100}%`,
            top: `${layout.split.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[52px] cursor-grab touch-none select-none items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-2.5 text-xs font-bold text-slate-900 shadow-lg backdrop-blur-md transition-transform active:cursor-grabbing dark:text-white whitespace-nowrap ${
            draggingKey === 'split'
              ? 'scale-105 border-sky-400 bg-sky-500/35 ring-4 ring-sky-400/30'
              : 'border-white/85 bg-white/70 dark:border-slate-400/70 dark:bg-slate-900/70'
          }`}
        >
          <Scissors className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>{t.splitBtn}</span>
          <Move className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Draggable Eject Button */}
        <div
          onPointerDown={(e) => handleStartDrag('eject', e)}
          onPointerMove={(e) => handleMoveDrag('eject', e)}
          onPointerUp={(e) => handleEndDrag('eject', e)}
          onPointerCancel={(e) => handleEndDrag('eject', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.eject.xPct * 100}%`,
            top: `${layout.eject.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[52px] cursor-grab touch-none select-none items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-2.5 text-xs font-bold text-slate-900 shadow-lg backdrop-blur-md transition-transform active:cursor-grabbing dark:text-white whitespace-nowrap ${
            draggingKey === 'eject'
              ? 'scale-105 border-sky-400 bg-sky-500/35 ring-4 ring-sky-400/30'
              : 'border-white/85 bg-white/70 dark:border-slate-400/70 dark:bg-slate-900/70'
          }`}
        >
          <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>{t.ejectBtn}</span>
          <Move className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Draggable Turbo Eject Button */}
        <div
          onPointerDown={(e) => handleStartDrag('fastEject', e)}
          onPointerMove={(e) => handleMoveDrag('fastEject', e)}
          onPointerUp={(e) => handleEndDrag('fastEject', e)}
          onPointerCancel={(e) => handleEndDrag('fastEject', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.fastEject.xPct * 100}%`,
            top: `${layout.fastEject.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[52px] cursor-grab touch-none select-none items-center gap-1.5 rounded-2xl border-2 border-dashed px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-lg backdrop-blur-md transition-transform active:cursor-grabbing whitespace-nowrap ${
            draggingKey === 'fastEject'
              ? 'scale-105 border-amber-300 bg-amber-400/80 ring-4 ring-amber-400/40'
              : 'border-amber-300 bg-gradient-to-b from-amber-400/90 to-orange-500/90'
          }`}
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>{t.fastEjectBtn}</span>
          <Move className="h-3.5 w-3.5 text-slate-900/70" />
        </div>

        {/* Draggable Zoom Button */}
        <div
          onPointerDown={(e) => handleStartDrag('zoom', e)}
          onPointerMove={(e) => handleMoveDrag('zoom', e)}
          onPointerUp={(e) => handleEndDrag('zoom', e)}
          onPointerCancel={(e) => handleEndDrag('zoom', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.zoom.xPct * 100}%`,
            top: `${layout.zoom.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[48px] cursor-grab touch-none select-none items-center gap-1.5 rounded-2xl border-2 border-dashed px-3.5 py-2 text-xs font-bold text-slate-900 shadow-lg backdrop-blur-md transition-transform active:cursor-grabbing dark:text-white whitespace-nowrap ${
            draggingKey === 'zoom'
              ? 'scale-105 border-sky-400 bg-sky-500/35 ring-4 ring-sky-400/30'
              : 'border-white/85 bg-white/70 dark:border-slate-400/70 dark:bg-slate-900/70'
          }`}
        >
          <ZoomIn className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>{t.zoomLabel}</span>
          <Move className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Draggable Minimap */}
        <div
          onPointerDown={(e) => handleStartDrag('minimap', e)}
          onPointerMove={(e) => handleMoveDrag('minimap', e)}
          onPointerUp={(e) => handleEndDrag('minimap', e)}
          onPointerCancel={(e) => handleEndDrag('minimap', e)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${layout.minimap.xPct * 100}%`,
            top: `${layout.minimap.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex h-20 w-20 cursor-grab touch-none select-none flex-col items-center justify-center rounded-2xl border-2 border-dashed shadow-lg backdrop-blur-md transition-transform active:cursor-grabbing sm:h-28 sm:w-28 [@media(max-height:520px)]:h-16 [@media(max-height:520px)]:w-16 ${
            draggingKey === 'minimap'
              ? 'scale-105 border-sky-400 bg-sky-500/35 ring-4 ring-sky-400/30'
              : 'border-white/85 bg-white/60 dark:border-slate-400/70 dark:bg-slate-900/60'
          }`}
        >
          <MapIcon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          <Move className="mt-1 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        </div>
      </div>
    </div>
  );
}
