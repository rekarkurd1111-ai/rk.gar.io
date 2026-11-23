import type { SkinDefinition, SkinId, SkinLevel } from './types.ts';

export const SKINS: SkinDefinition[] = [
  {
    id: 'kurdish_sun',
    nameCkb: 'خۆر',
    nameEn: 'Sunburst',
    primary: '#E11D48',
    secondary: '#F59E0B',
    stroke: '#9F1239',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'coins',
  },
  {
    id: 'ocean',
    nameCkb: 'زەریا',
    nameEn: 'Ocean',
    primary: '#0284C7',
    secondary: '#38BDF8',
    stroke: '#075985',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'coins',
  },
  {
    id: 'emerald',
    nameCkb: 'زموڕوت',
    nameEn: 'Emerald',
    primary: '#059669',
    secondary: '#34D399',
    stroke: '#065F46',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'coins',
  },
  {
    id: 'crimson',
    nameCkb: 'یاقووت',
    nameEn: 'Crimson',
    primary: '#DC2626',
    secondary: '#FCA5A5',
    stroke: '#991B1B',
    textColor: '#FFFFFF',
    price: 120,
    currency: 'coins',
  },
  {
    id: 'mint_wave',
    nameCkb: 'شەپۆل',
    nameEn: 'Teal Wave',
    primary: '#0D9488',
    secondary: '#99F6E4',
    stroke: '#134E4A',
    textColor: '#FFFFFF',
    price: 160,
    currency: 'coins',
  },
  {
    id: 'rose_petal',
    nameCkb: 'گوڵاڵە',
    nameEn: 'Coral',
    primary: '#E11D48',
    secondary: '#FDA4AF',
    stroke: '#881337',
    textColor: '#FFFFFF',
    price: 200,
    currency: 'coins',
  },
  {
    id: 'amber_hive',
    nameCkb: 'شانەهەنگ',
    nameEn: 'Honeycomb',
    primary: '#D97706',
    secondary: '#FCD34D',
    stroke: '#92400E',
    textColor: '#FFFFFF',
    price: 280,
    currency: 'coins',
  },
  {
    id: 'obsidian',
    nameCkb: 'ئۆبسیدیان',
    nameEn: 'Obsidian',
    primary: '#334155',
    secondary: '#94A3B8',
    stroke: '#0F172A',
    textColor: '#FFFFFF',
    price: 350,
    currency: 'coins',
  },
  {
    id: 'nebula',
    nameCkb: 'گەردوون',
    nameEn: 'Nebula',
    primary: '#6D28D9',
    secondary: '#C084FC',
    stroke: '#4C1D95',
    textColor: '#FFFFFF',
    price: 20,
    currency: 'dna',
  },
  {
    id: 'atomic',
    nameCkb: 'ئەتۆم',
    nameEn: 'Atomic',
    primary: '#0F766E',
    secondary: '#2DD4BF',
    stroke: '#115E59',
    textColor: '#FFFFFF',
    price: 30,
    currency: 'dna',
  },
  {
    id: 'solar_flare',
    nameCkb: 'گڕی خۆر',
    nameEn: 'Solar Flare',
    primary: '#EA580C',
    secondary: '#FDE047',
    stroke: '#9A3412',
    textColor: '#FFFFFF',
    price: 45,
    currency: 'dna',
  },
  {
    id: 'royal_crown',
    nameCkb: 'تاجی شاهانە',
    nameEn: 'Royal Crown',
    primary: '#1E293B',
    secondary: '#FACC15',
    stroke: '#CA8A04',
    textColor: '#FFFFFF',
    price: 70,
    currency: 'dna',
  },
  {
    id: 'vip_barbarian',
    nameCkb: 'بەربەری VIP',
    nameEn: 'Barbarian',
    primary: '#0284C7',
    secondary: '#FDE047',
    stroke: '#0EA5E9',
    textColor: '#FFFFFF',
    price: 450,
    currency: 'coins',
    isVip: true,
    upgradeLv2Price: 350,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 35,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'vip_imp',
    nameCkb: 'ئیمپ VIP',
    nameEn: 'Imp',
    primary: '#991B1B',
    secondary: '#FB7185',
    stroke: '#450A0A',
    textColor: '#FFFFFF',
    price: 550,
    currency: 'coins',
    isVip: true,
    upgradeLv2Price: 400,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 40,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'vip_frost_giant',
    nameCkb: 'فڕۆست جاینت VIP',
    nameEn: 'Frost Giant',
    primary: '#0EA5E9',
    secondary: '#E0F2FE',
    stroke: '#22D3EE',
    textColor: '#FFFFFF',
    price: 40,
    currency: 'dna',
    isVip: true,
    upgradeLv2Price: 500,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 45,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'vip_fire_lord',
    nameCkb: 'فایەر لۆرد VIP',
    nameEn: 'Fire Lord',
    primary: '#DC2626',
    secondary: '#FACC15',
    stroke: '#991B1B',
    textColor: '#FFFFFF',
    price: 55,
    currency: 'dna',
    isVip: true,
    upgradeLv2Price: 600,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 55,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'vip_shadow_king',
    nameCkb: 'شادۆ کینگ VIP',
    nameEn: 'Shadow King',
    primary: '#4C1D95',
    secondary: '#E879F9',
    stroke: '#A855F7',
    textColor: '#FFFFFF',
    price: 70,
    currency: 'dna',
    isVip: true,
    upgradeLv2Price: 700,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 65,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'vip_prismatic',
    nameCkb: 'پریزما نۆڤا VIP',
    nameEn: 'Prismatic Nova',
    primary: '#7C3AED',
    secondary: '#38BDF8',
    stroke: '#F472B6',
    textColor: '#FFFFFF',
    price: 90,
    currency: 'dna',
    isVip: true,
    upgradeLv2Price: 800,
    upgradeLv2Currency: 'coins',
    upgradeLv3Price: 85,
    upgradeLv3Currency: 'dna',
  },
  {
    id: 'cyber_pulse',
    nameCkb: 'سایبەر پەڵس',
    nameEn: 'Cyber Pulse',
    primary: '#0F172A',
    secondary: '#22D3EE',
    stroke: '#06B6D4',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'dna',
    seasonExclusive: true,
  },
  {
    id: 'golden_phoenix',
    nameCkb: 'سیمرخی زێڕین',
    nameEn: 'Golden Phoenix',
    primary: '#B45309',
    secondary: '#FDE047',
    stroke: '#F59E0B',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'dna',
    seasonExclusive: true,
  },
  {
    id: 'neon_lotus',
    nameCkb: 'نیۆن لۆتەس',
    nameEn: 'Neon Lotus',
    primary: '#831843',
    secondary: '#F472B6',
    stroke: '#EC4899',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'dna',
    seasonExclusive: true,
  },
  {
    id: 'galaxy_dragon',
    nameCkb: 'ئەژدیهای گەردوون',
    nameEn: 'Galaxy Dragon',
    primary: '#1E1B4B',
    secondary: '#A855F7',
    stroke: '#7C3AED',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'dna',
    seasonExclusive: true,
  },
  {
    id: 'nexus_titan',
    nameCkb: 'تایتانی نێکسەس',
    nameEn: 'Nexus Titan',
    primary: '#0F172A',
    secondary: '#38BDF8',
    stroke: '#F59E0B',
    textColor: '#FFFFFF',
    price: 0,
    currency: 'dna',
    seasonExclusive: true,
  },
];

export const SKIN_MAP: Record<SkinId, SkinDefinition> = SKINS.reduce(
  (acc, skin) => {
    acc[skin.id] = skin;
    return acc;
  },
  {} as Record<SkinId, SkinDefinition>
);

export function getSkinLevel(
  skinLevels: Partial<Record<SkinId, SkinLevel>> | undefined,
  skinId: SkinId
): SkinLevel {
  const skin = SKIN_MAP[skinId];
  if (!skin?.isVip) return 1;
  const lvl = skinLevels?.[skinId];
  return lvl === 3 ? 3 : lvl === 2 ? 2 : 1;
}

export function encodeUnlockedSkinsWithLevels(
  unlockedSkins: SkinId[],
  skinLevels?: Partial<Record<SkinId, SkinLevel>>
): string[] {
  const base = unlockedSkins.filter((id) => Boolean(SKIN_MAP[id]));
  const orderedBase = base.includes('kurdish_sun')
    ? ['kurdish_sun', ...base.filter((id) => id !== 'kurdish_sun')]
    : base.length > 0
    ? base
    : ['kurdish_sun'];

  const levelTags: string[] = [];
  if (skinLevels) {
    for (const skinId of orderedBase) {
      const skin = SKIN_MAP[skinId as SkinId];
      if (!skin?.isVip) continue;
      const lvl = skinLevels[skinId as SkinId];
      if (lvl === 2 || lvl === 3) {
        levelTags.push(`${skinId}:lv${lvl}`);
      }
    }
  }
  return Array.from(new Set([...orderedBase, ...levelTags])).slice(0, 50);
}

export function decodeUnlockedSkinsWithLevels(rawList: unknown): {
  unlockedSkins: SkinId[];
  skinLevels: Partial<Record<SkinId, SkinLevel>>;
} {
  const unlocked = new Set<SkinId>();
  const skinLevels: Partial<Record<SkinId, SkinLevel>> = {};
  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      if (typeof item !== 'string') continue;
      const lvMatch = item.match(/^([a-z0-9_]+):lv([23])$/);
      if (lvMatch) {
        const sid = lvMatch[1] as SkinId;
        const lv = Number(lvMatch[2]) as SkinLevel;
        if (SKIN_MAP[sid]) {
          unlocked.add(sid);
          const prev = skinLevels[sid] || 1;
          if (lv > prev) skinLevels[sid] = lv;
        }
      } else if (item in SKIN_MAP) {
        unlocked.add(item as SkinId);
      }
    }
  }
  if (unlocked.size === 0) {
    unlocked.add('kurdish_sun');
  }
  return {
    unlockedSkins: Array.from(unlocked),
    skinLevels,
  };
}

export function getDynamicSkinStroke(
  skinId: SkinId,
  time: number,
  skinLevel: SkinLevel = 1
): string {
  const skin = SKIN_MAP[skinId] || SKIN_MAP.ocean;
  if (skin.isVip && skinLevel >= 3) {
    const hue = Math.round((time * 105 + hashSkinHue(skinId)) % 360);
    return `hsl(${hue}, 96%, 60%)`;
  }
  return skin.stroke;
}

function hashSkinHue(skinId: string): number {
  let h = 0;
  for (let i = 0; i < skinId.length; i++) {
    h = (h * 31 + skinId.charCodeAt(i)) % 360;
  }
  return h;
}

export function drawVipOuterGlow(
  ctx: CanvasRenderingContext2D,
  skinId: SkinId,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  skinLevel: SkinLevel = 1
) {
  const skin = SKIN_MAP[skinId];
  if (!skin?.isVip || skinLevel < 2 || radius < 8) return;

  const baseHue = (time * 105 + hashSkinHue(skinId)) % 360;
  const pulse = 1 + Math.sin(time * 4.5) * 0.06;

  ctx.save();
  if (skinLevel === 3) {
    const glowR = radius * 1.38 * pulse;
    const aura = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, glowR);
    aura.addColorStop(0, `hsla(${baseHue}, 100%, 62%, 0.48)`);
    aura.addColorStop(0.55, `hsla(${(baseHue + 65) % 360}, 95%, 58%, 0.22)`);
    aura.addColorStop(1, `hsla(${(baseHue + 130) % 360}, 95%, 55%, 0)`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting twinkling sparkles outside rim
    const sparkCount = radius > 34 ? 8 : 5;
    for (let i = 0; i < sparkCount; i++) {
      const a = time * 1.65 + (i * Math.PI * 2) / sparkCount;
      const dist = radius * (1.13 + Math.sin(time * 5 + i * 1.7) * 0.05);
      const sx = cx + Math.cos(a) * dist;
      const sy = cy + Math.sin(a) * dist;
      const sr = Math.max(1.6, radius * 0.075) * (0.65 + Math.abs(Math.sin(time * 6 + i)) * 0.55);
      const sHue = (baseHue + i * 42) % 360;
      ctx.fillStyle = `hsla(${sHue}, 100%, 76%, 0.92)`;
      drawStarSparkle(ctx, sx, sy, sr, time * 2 + i);
    }
  } else {
    // Level 2 subtle shimmer ring
    const glowR = radius * 1.18 * pulse;
    const aura = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, glowR);
    aura.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSkinPattern(
  ctx: CanvasRenderingContext2D,
  skinId: SkinId,
  cx: number,
  cy: number,
  radius: number,
  time: number,
  skinLevel: SkinLevel = 1
) {
  const skin = SKIN_MAP[skinId] || SKIN_MAP.ocean;

  ctx.fillStyle = skin.primary;
  ctx.fill();

  if (radius < 10) return;

  ctx.save();
  ctx.clip();

  switch (skinId) {
    case 'kurdish_sun': {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 0.66);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(cx - radius, cy - radius * 0.34, radius * 2, radius * 0.68);
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(cx - radius, cy + radius * 0.34, radius * 2, radius * 0.66);

      ctx.fillStyle = '#FACC15';
      const rays = 21;
      const innerR = radius * 0.25;
      const outerR = radius * 0.52;
      ctx.beginPath();
      for (let i = 0; i < rays * 2; i++) {
        const angle = (i * Math.PI) / rays + time * 0.25;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'ocean': {
      const grad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      grad.addColorStop(0, '#38BDF8');
      grad.addColorStop(0.65, '#0284C7');
      grad.addColorStop(1, '#0369A1');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'emerald': {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = Math.max(1.5, radius * 0.08);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * (0.3 + i * 0.25), time * 0.4 + i, time * 0.4 + i + Math.PI * 1.3);
        ctx.stroke();
      }
      break;
    }

    case 'amber_hive': {
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.28)';
      ctx.lineWidth = Math.max(1, radius * 0.04);
      const step = radius * 0.42;
      for (let gx = -radius; gx <= radius; gx += step) {
        for (let gy = -radius; gy <= radius; gy += step * 0.86) {
          const offsetX = Math.round(gy / (step * 0.86)) % 2 === 0 ? 0 : step * 0.5;
          drawHex(ctx, cx + gx + offsetX, cy + gy, step * 0.46);
        }
      }
      break;
    }

    case 'nebula': {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, '#F472B6');
      grad.addColorStop(0.5, '#7C3AED');
      grad.addColorStop(1, '#312E81');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + time * 0.3;
        const d = radius * (0.35 + (i % 2) * 0.28);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(1.5, radius * 0.05), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'atomic': {
      ctx.strokeStyle = 'rgba(204, 251, 241, 0.35)';
      ctx.lineWidth = Math.max(1.5, radius * 0.05);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 3 + time * 0.45);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.78, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#99F6E4';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'crimson': {
      const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      grad.addColorStop(0, '#EF4444');
      grad.addColorStop(1, '#991B1B');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.28, cy - radius * 0.28, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rose_petal': {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - time * 0.2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * radius * 0.45, cy + Math.sin(a) * radius * 0.45, radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'mint_wave': {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.quadraticCurveTo(cx - radius * 0.4, cy - radius * 0.45, cx, cy);
      ctx.quadraticCurveTo(cx + radius * 0.4, cy + radius * 0.45, cx + radius, cy);
      ctx.lineTo(cx + radius, cy + radius);
      ctx.lineTo(cx - radius, cy + radius);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'obsidian': {
      const grad = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.25, radius * 0.1, cx, cy, radius);
      grad.addColorStop(0, '#64748B');
      grad.addColorStop(0.55, '#334155');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
      ctx.lineWidth = Math.max(1.5, radius * 0.05);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'solar_flare': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.45, '#F97316');
      grad.addColorStop(1, '#9A3412');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + time * 0.35;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * radius * 0.32, cy + Math.sin(a) * radius * 0.32);
        ctx.lineTo(cx + Math.cos(a + 0.35) * radius * 0.9, cy + Math.sin(a + 0.35) * radius * 0.9);
        ctx.stroke();
      }
      break;
    }

    case 'royal_crown': {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      // Golden diamond star center
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + time * 0.2;
        const r = i % 2 === 0 ? radius * 0.42 : radius * 0.18;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'cyber_pulse': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
      grad.addColorStop(0, '#0891B2');
      grad.addColorStop(0.55, '#0F172A');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.lineWidth = Math.max(1.5, radius * 0.055);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          radius * (0.42 + i * 0.3),
          time * 0.8 + i,
          time * 0.8 + i + Math.PI * 1.45
        );
        ctx.stroke();
      }
      ctx.fillStyle = '#67E8F9';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'golden_phoenix': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.5, '#F59E0B');
      grad.addColorStop(1, '#7C2D12');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + time * 0.35;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.15) * radius * 0.85, cy + Math.sin(a - 0.15) * radius * 0.85);
        ctx.lineTo(cx + Math.cos(a + 0.15) * radius * 0.85, cy + Math.sin(a + 0.15) * radius * 0.85);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'neon_lotus': {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, '#F472B6');
      grad.addColorStop(0.6, '#BE185D');
      grad.addColorStop(1, '#500724');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(251, 207, 232, 0.45)';
      ctx.lineWidth = Math.max(1.5, radius * 0.05);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - time * 0.25;
        ctx.beginPath();
        ctx.ellipse(
          cx + Math.cos(a) * radius * 0.38,
          cy + Math.sin(a) * radius * 0.38,
          radius * 0.36,
          radius * 0.18,
          a,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      break;
    }

    case 'galaxy_dragon': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      grad.addColorStop(0, '#38BDF8');
      grad.addColorStop(0.45, '#7C3AED');
      grad.addColorStop(1, '#0F0728');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.lineWidth = Math.max(1.5, radius * 0.055);
      drawHex(ctx, cx, cy, radius * 0.65);
      ctx.fillStyle = '#E9D5FF';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 + time * 0.4;
        const r = i % 2 === 0 ? radius * 0.36 : radius * 0.16;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'nexus_titan': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
      grad.addColorStop(0, '#FDE047');
      grad.addColorStop(0.35, '#0EA5E9');
      grad.addColorStop(0.75, '#1E293B');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      drawHex(ctx, cx, cy, radius * 0.7);
      drawHex(ctx, cx, cy, radius * 0.42);

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.17, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vip_barbarian': {
      const hue = (time * 95 + 20) % 360;
      const bg = ctx.createRadialGradient(cx, cy - radius * 0.2, radius * 0.1, cx, cy, radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, `hsl(${hue}, 95%, 64%)`);
        bg.addColorStop(0.55, `hsl(${(hue + 55) % 360}, 88%, 48%)`);
        bg.addColorStop(1, '#0F172A');
      } else {
        bg.addColorStop(0, '#38BDF8');
        bg.addColorStop(0.6, '#0284C7');
        bg.addColorStop(1, '#0F172A');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Golden Viking/Barbarian Helmet Horns
      ctx.fillStyle = skinLevel === 3 ? '#FEF08A' : '#FACC15';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * radius * 0.25, cy - radius * 0.12);
        ctx.quadraticCurveTo(
          cx + dir * radius * 0.88,
          cy - radius * 0.25,
          cx + dir * radius * 0.72,
          cy - radius * 0.78
        );
        ctx.quadraticCurveTo(
          cx + dir * radius * 0.54,
          cy - radius * 0.42,
          cx + dir * radius * 0.18,
          cy - radius * 0.38
        );
        ctx.closePath();
        ctx.fill();
      }

      // Helmet brow & glowing eyes
      ctx.fillStyle = skinLevel >= 2 ? '#78350F' : '#92400E';
      ctx.beginPath();
      ctx.arc(cx, cy - radius * 0.05, radius * 0.42, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = skinLevel === 3 ? `hsl(${(hue + 160) % 360}, 100%, 68%)` : '#F43F5E';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + dir * radius * 0.18, cy + radius * 0.12, radius * 0.11, radius * 0.06, dir * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'vip_imp': {
      const hue = (time * 110 + 340) % 360;
      const bg = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, `hsl(${hue}, 100%, 62%)`);
        bg.addColorStop(0.55, `hsl(${(hue + 45) % 360}, 85%, 36%)`);
        bg.addColorStop(1, '#1A0505');
      } else {
        bg.addColorStop(0, '#EF4444');
        bg.addColorStop(0.65, '#991B1B');
        bg.addColorStop(1, '#450A0A');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Horns
      ctx.fillStyle = skinLevel === 3 ? '#FDE047' : '#FB7185';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * radius * 0.22, cy - radius * 0.24);
        ctx.lineTo(cx + dir * radius * 0.62, cy - radius * 0.72);
        ctx.lineTo(cx + dir * radius * 0.44, cy - radius * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      // Mischievous grin & eyes
      ctx.fillStyle = '#FEF08A';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + dir * radius * 0.22, cy - radius * 0.02, radius * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, radius * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy + radius * 0.18, radius * 0.34, 0.18, Math.PI - 0.18);
      ctx.stroke();
      break;
    }

    case 'vip_frost_giant': {
      const hue = (time * 90 + 185) % 360;
      const bg = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, `hsl(${hue}, 95%, 72%)`);
        bg.addColorStop(0.5, `hsl(${(hue + 55) % 360}, 92%, 52%)`);
        bg.addColorStop(1, '#082F49');
      } else {
        bg.addColorStop(0, '#E0F2FE');
        bg.addColorStop(0.5, '#38BDF8');
        bg.addColorStop(1, '#0C4A6E');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Rotating ice crystal / snowflake core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.5, radius * 0.06);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + time * (skinLevel === 3 ? 0.8 : 0.25);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * radius * 0.72, cy + Math.sin(a) * radius * 0.72);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vip_fire_lord': {
      const hue = (time * 115 + 15) % 360;
      const bg = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, '#FFFFFF');
        bg.addColorStop(0.35, `hsl(${hue}, 100%, 60%)`);
        bg.addColorStop(0.75, `hsl(${(hue + 40) % 360}, 95%, 45%)`);
        bg.addColorStop(1, '#450A0A');
      } else {
        bg.addColorStop(0, '#FEF08A');
        bg.addColorStop(0.45, '#F97316');
        bg.addColorStop(1, '#7F1D1D');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Blazing flame spiral
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7 + time * (skinLevel >= 2 ? 0.9 : 0.35);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(
          cx + Math.cos(a + 0.4) * radius * 0.5,
          cy + Math.sin(a + 0.4) * radius * 0.5,
          cx + Math.cos(a) * radius * 0.85,
          cy + Math.sin(a) * radius * 0.85
        );
        ctx.quadraticCurveTo(
          cx + Math.cos(a - 0.25) * radius * 0.45,
          cy + Math.sin(a - 0.25) * radius * 0.45,
          cx,
          cy
        );
        ctx.fill();
      }
      break;
    }

    case 'vip_shadow_king': {
      const hue = (time * 100 + 275) % 360;
      const bg = ctx.createRadialGradient(cx, cy, radius * 0.06, cx, cy, radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, `hsl(${hue}, 100%, 68%)`);
        bg.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 85%, 38%)`);
        bg.addColorStop(1, '#09021A');
      } else {
        bg.addColorStop(0, '#C084FC');
        bg.addColorStop(0.55, '#4C1D95');
        bg.addColorStop(1, '#0F0728');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Crown emblem
      ctx.fillStyle = skinLevel === 3 ? '#FDE047' : '#E879F9';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.45, cy + radius * 0.22);
      ctx.lineTo(cx - radius * 0.48, cy - radius * 0.28);
      ctx.lineTo(cx - radius * 0.2, cy - radius * 0.02);
      ctx.lineTo(cx, cy - radius * 0.42);
      ctx.lineTo(cx + radius * 0.2, cy - radius * 0.02);
      ctx.lineTo(cx + radius * 0.48, cy - radius * 0.28);
      ctx.lineTo(cx + radius * 0.45, cy + radius * 0.22);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'vip_prismatic': {
      const hue = (time * 125) % 360;
      const bg = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
      if (skinLevel === 3) {
        bg.addColorStop(0, '#FFFFFF');
        bg.addColorStop(0.32, `hsl(${hue}, 100%, 64%)`);
        bg.addColorStop(0.68, `hsl(${(hue + 110) % 360}, 95%, 54%)`);
        bg.addColorStop(1, `hsl(${(hue + 220) % 360}, 90%, 38%)`);
      } else {
        bg.addColorStop(0, '#E0F2FE');
        bg.addColorStop(0.45, '#A855F7');
        bg.addColorStop(1, '#1E1B4B');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = Math.max(1.5, radius * 0.055);
      drawHex(ctx, cx, cy, radius * 0.66);
      drawHex(ctx, cx, cy, radius * 0.36);
      break;
    }
  }

  // VIP Level 2 & Level 3 internal shine, color-shifting veil & sparkles
  if (skin.isVip && skinLevel >= 2) {
    const hue = (time * 105 + hashSkinHue(skinId)) % 360;
    if (skinLevel === 3) {
      // Shimmering iridescent rotating color overlay + glass gleam
      const sweepAngle = time * 1.4;
      const gx1 = cx + Math.cos(sweepAngle) * radius;
      const gy1 = cy + Math.sin(sweepAngle) * radius;
      const gleam = ctx.createLinearGradient(cx - (gx1 - cx), cy - (gy1 - cy), gx1, gy1);
      gleam.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.26)`);
      gleam.addColorStop(0.5, 'rgba(255, 255, 255, 0.34)');
      gleam.addColorStop(1, `hsla(${(hue + 140) % 360}, 100%, 66%, 0.28)`);
      ctx.fillStyle = gleam;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Inner twinkling sparkles
      for (let i = 0; i < 4; i++) {
        const a = -time * 1.1 + (i * Math.PI) / 2;
        const dist = radius * 0.54;
        const sx = cx + Math.cos(a) * dist;
        const sy = cy + Math.sin(a) * dist;
        const sr = Math.max(1.5, radius * 0.085) * (0.7 + Math.abs(Math.sin(time * 5 + i)) * 0.45);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawStarSparkle(ctx, sx, sy, sr, time * 2.5 + i);
      }
    } else {
      // Level 2 subtle diagonal sheen
      const sheen = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = sheen;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
  }

  ctx.restore();
}

function drawStarSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? r * 1.35 : r * 0.38;
    const px = Math.cos(a) * len;
    const py = Math.sin(a) * len;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}
