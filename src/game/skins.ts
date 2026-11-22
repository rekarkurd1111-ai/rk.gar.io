import type { SkinDefinition, SkinId } from './types.ts';

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

export function drawSkinPattern(
  ctx: CanvasRenderingContext2D,
  skinId: SkinId,
  cx: number,
  cy: number,
  radius: number,
  time: number
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
  }

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
