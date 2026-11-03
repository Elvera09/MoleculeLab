import { useEffect, useRef } from "react";
import "./CosmicAtmosphere.css";

const PARTICLES = Array.from({ length: 72 }, (_, index) => ({
  left: `${(index * 37.7) % 100}%`,
  top: `${(index * 61.3) % 100}%`,
  delay: `${-((index * 0.73) % 18)}s`,
  duration: `${12 + ((index * 1.17) % 18)}s`,
  size: `${1 + ((index * 13) % 3)}px`,
}));

export default function CosmicAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let animation = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      if (!context) return;
      frame += 0.003;
      context.clearRect(0, 0, width, height);

      // Soft, slowly shifting nebula light fields.
      const clouds = [
        { x: width * (0.18 + Math.sin(frame) * 0.035), y: height * 0.22, r: Math.max(width, height) * 0.48, color: "90, 48, 190" },
        { x: width * (0.78 + Math.cos(frame * 0.8) * 0.04), y: height * 0.62, r: Math.max(width, height) * 0.42, color: "18, 115, 175" },
        { x: width * 0.52, y: height * (0.92 + Math.sin(frame * 0.6) * 0.025), r: Math.max(width, height) * 0.34, color: "125, 45, 135" },
      ];
      clouds.forEach((cloud) => {
        const gradient = context.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
        gradient.addColorStop(0, `rgba(${cloud.color}, 0.15)`);
        gradient.addColorStop(0.42, `rgba(${cloud.color}, 0.065)`);
        gradient.addColorStop(1, `rgba(${cloud.color}, 0)`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      });

      // Fine star field with a small number of connecting constellation lines.
      const stars = Array.from({ length: 86 }, (_, i) => ({
        x: ((i * 127.1) % 997) / 997 * width,
        y: ((i * 311.7) % 991) / 991 * height,
        phase: i * 1.7,
      }));
      stars.forEach((star, i) => {
        const alpha = 0.22 + (Math.sin(frame * 2 + star.phase) + 1) * 0.22;
        context.beginPath();
        context.arc(star.x, star.y, i % 9 === 0 ? 1.7 : 0.8, 0, Math.PI * 2);
        context.fillStyle = `rgba(190, 224, 255, ${alpha})`;
        context.fill();
        if (i % 11 === 0) {
          const next = stars[(i + 4) % stars.length];
          context.beginPath();
          context.moveTo(star.x, star.y);
          context.lineTo(next.x, next.y);
          context.strokeStyle = "rgba(105, 190, 235, 0.075)";
          context.lineWidth = 0.7;
          context.stroke();
        }
      });

      if (!reduceMotion) animation = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <div className="cosmic-atmosphere" aria-hidden="true">
      <canvas ref={canvasRef} className="cosmic-atmosphere__canvas" />
      <div className="cosmic-atmosphere__vignette" />
      <div className="cosmic-atmosphere__grain" />
      <div className="cosmic-atmosphere__stars">
        {PARTICLES.map((particle, index) => (
          <i
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
