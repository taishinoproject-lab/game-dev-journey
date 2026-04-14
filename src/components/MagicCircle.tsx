import React, { useRef, useEffect, useCallback } from 'react';
import { getComboColor, getComboGlowColor, getElementColor, SpellElement, MagicCircleType } from '../game/types';

interface MagicCircleProps {
  progress: number; // 0-1
  combo: number;
  element: SpellElement;
  circleType: MagicCircleType;
  castingAnimation: boolean;
}

const MagicCircle: React.FC<MagicCircleProps> = ({ progress, combo, element, circleType, castingAnimation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.42;

    ctx.clearRect(0, 0, w, h);

    if (progress <= 0 && !castingAnimation) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    const mainColor = getComboColor(combo);
    const glowColor = getComboGlowColor(combo);
    const elemColor = getElementColor(element);
    const isMaxCombo = combo >= 20;

    rotationRef.current += castingAnimation ? 0 : 0.005;
    const rotation = rotationRef.current;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 + progress * 30;

    // Stage 1: Outer circle (0-20%)
    if (progress > 0) {
      const circleProgress = Math.min(progress / 0.2, 1);
      ctx.beginPath();
      ctx.arc(0, 0, maxR, 0, Math.PI * 2 * circleProgress);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = isMaxCombo ? 1.5 : 2;
      ctx.stroke();

      if (circleProgress >= 1) {
        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, maxR * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Stage 2: Geometric pattern (20-40%)
    if (progress > 0.2) {
      const geoProgress = Math.min((progress - 0.2) / 0.2, 1);
      const points = getShapePoints(circleType, maxR * 0.75);
      const visiblePoints = Math.ceil(points.length * geoProgress);

      ctx.beginPath();
      for (let i = 0; i < visiblePoints; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      if (geoProgress >= 1) ctx.closePath();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = isMaxCombo ? 1 : 1.5;
      ctx.stroke();

      // Inner connections
      if (geoProgress > 0.5) {
        const innerProgress = (geoProgress - 0.5) * 2;
        ctx.globalAlpha = innerProgress;
        drawInnerConnections(ctx, points, maxR * 0.3, mainColor, isMaxCombo);
        ctx.globalAlpha = 1;
      }
    }

    // Stage 3: Rune text around circle (40-60%)
    if (progress > 0.4) {
      const textProgress = Math.min((progress - 0.4) / 0.2, 1);
      const runeChars = '月解道鬼縛破斬霊滅却';
      const charCount = Math.ceil(runeChars.length * textProgress);

      ctx.font = '10px "Noto Serif JP", serif';
      ctx.fillStyle = mainColor;
      ctx.globalAlpha = 0.7 * textProgress;

      for (let i = 0; i < charCount; i++) {
        const angle = (i / runeChars.length) * Math.PI * 2 - Math.PI / 2;
        const r = maxR * 0.92;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(runeChars[i], -5, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // Stage 4: Inner symbol (60-80%)
    if (progress > 0.6) {
      const symbolProgress = Math.min((progress - 0.6) / 0.2, 1);
      const pulse = 0.9 + Math.sin(Date.now() * 0.003) * 0.1;

      ctx.globalAlpha = symbolProgress;
      ctx.beginPath();
      ctx.arc(0, 0, maxR * 0.2 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cross pattern
      const crossR = maxR * 0.15 * symbolProgress;
      ctx.beginPath();
      ctx.moveTo(-crossR, 0); ctx.lineTo(crossR, 0);
      ctx.moveTo(0, -crossR); ctx.lineTo(0, crossR);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Stage 5: Full completion glow (80-100%)
    if (progress > 0.8) {
      const finalProgress = Math.min((progress - 0.8) / 0.2, 1);
      const glowIntensity = finalProgress * (0.5 + Math.sin(Date.now() * 0.005) * 0.3);

      ctx.beginPath();
      ctx.arc(0, 0, maxR * 0.5, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.5);
      grad.addColorStop(0, `${mainColor}${Math.floor(glowIntensity * 80).toString(16).padStart(2, '0')}`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Casting animation - convergence
    if (castingAnimation) {
      const t = (Date.now() % 1500) / 1500;
      if (t < 0.33) {
        // Pause - stillness
        ctx.shadowBlur = 5;
      } else if (t < 0.66) {
        // Converge
        const ct = (t - 0.33) / 0.33;
        const convergR = maxR * (1 - ct);
        ctx.beginPath();
        ctx.arc(0, 0, convergR, 0, Math.PI * 2);
        ctx.fillStyle = `${glowColor}${Math.floor(ct * 200).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
    }

    ctx.restore();
    animationRef.current = requestAnimationFrame(draw);
  }, [progress, combo, element, circleType, castingAnimation]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = '300px';
    canvas.style.height = '300px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  return <canvas ref={canvasRef} className="w-[300px] h-[300px]" />;
};

function getShapePoints(type: MagicCircleType, radius: number): { x: number; y: number }[] {
  const sides = { circle: 12, pentagram: 5, hexagram: 6, octagram: 8, complex: 10 }[type];
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

function drawInnerConnections(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  innerR: number,
  color: string,
  thin: boolean
) {
  // Connect every other point for star pattern
  const step = Math.floor(points.length / 2);
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const target = points[(i + step) % points.length];
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(target.x, target.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thin ? 0.5 : 1;
  ctx.stroke();
}

export default MagicCircle;
