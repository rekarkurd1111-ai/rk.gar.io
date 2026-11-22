import { ControlLayout, ControlPoint } from './types';

const STORAGE_LAYOUT_KEY = 'xane_control_layout_v1';

export const DEFAULT_CONTROL_LAYOUT: ControlLayout = {
  showJoystick: true,
  joystick: { xPct: 0.18, yPct: 0.80 },
  eject: { xPct: 0.56, yPct: 0.85 },
  fastEject: { xPct: 0.70, yPct: 0.85 },
  split: { xPct: 0.85, yPct: 0.80 },
  zoom: { xPct: 0.87, yPct: 0.65 },
  minimap: { xPct: 0.14, yPct: 0.54 },
};

export function clampControlPoint(point: ControlPoint): ControlPoint {
  return {
    xPct: Math.max(0.07, Math.min(0.93, Number(point.xPct) || 0.5)),
    yPct: Math.max(0.16, Math.min(0.91, Number(point.yPct) || 0.5)),
  };
}

export function loadControlLayout(): ControlLayout {
  try {
    const raw = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if (!raw) return DEFAULT_CONTROL_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<ControlLayout>;
    const resolvedEject = parsed.eject
      ? clampControlPoint(parsed.eject)
      : DEFAULT_CONTROL_LAYOUT.eject;
    return {
      showJoystick:
        typeof parsed.showJoystick === 'boolean'
          ? parsed.showJoystick
          : DEFAULT_CONTROL_LAYOUT.showJoystick,
      joystick: parsed.joystick
        ? clampControlPoint(parsed.joystick)
        : DEFAULT_CONTROL_LAYOUT.joystick,
      split: parsed.split ? clampControlPoint(parsed.split) : DEFAULT_CONTROL_LAYOUT.split,
      eject: resolvedEject,
      fastEject: parsed.fastEject
        ? clampControlPoint(parsed.fastEject)
        : clampControlPoint({
            xPct: resolvedEject.xPct <= 0.75 ? resolvedEject.xPct + 0.13 : resolvedEject.xPct - 0.13,
            yPct: resolvedEject.yPct,
          }),
      zoom: parsed.zoom ? clampControlPoint(parsed.zoom) : DEFAULT_CONTROL_LAYOUT.zoom,
      minimap: parsed.minimap
        ? clampControlPoint(parsed.minimap)
        : DEFAULT_CONTROL_LAYOUT.minimap,
    };
  } catch {
    return DEFAULT_CONTROL_LAYOUT;
  }
}

export function saveControlLayout(layout: ControlLayout): void {
  try {
    localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage errors
  }
}
