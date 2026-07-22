import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ==========================================================================
   1. LENIS SMOOTH SCROLL HOOK
   ========================================================================== */
export const useLenisScroll = (LenisClass) => {
  useEffect(() => {
    if (!LenisClass) return;
    const lenis = new LenisClass({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    lenis.scrollTo(0, { immediate: true });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const animationFrame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrame);
      lenis.destroy();
    };
  }, [LenisClass]);
};

/* ==========================================================================
   2. HTML5 CANVAS PARTICLE NETWORK (60 FPS)
   ========================================================================== */
export const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.2
    }));

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();

        // Connect to mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.35 * (1 - dist / 140)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Connect to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pDx = p2.x - p.x;
          const pDy = p2.y - p.y;
          const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
          if (pDist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - pDist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="dev-particle-canvas" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }} 
    />
  );
};

/* ==========================================================================
   3. MOUSE SPOTLIGHT FOLLOWER
   ========================================================================== */
export const MouseSpotlight = () => {
  const [pos, setPos] = useState({ x: -500, y: -500 });

  useEffect(() => {
    const handleMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      className="dev-mouse-spotlight"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(56, 189, 248, 0.08), transparent 80%)`
      }}
    />
  );
};

/* ==========================================================================
   4. 3D PERSPECTIVE TILT CARD
   ========================================================================== */
export const TiltCard = ({ children, className = '', style = {} }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        ...style
      }}
      className={`dev-glass-card ${className}`}
    >
      {children}
    </motion.div>
  );
};

/* ==========================================================================
   5. MAGNETIC BUTTON WRAPPER
   ========================================================================== */
export const MagneticButton = ({ children, className = '', onClick, style = {} }) => {
  const btnRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMouseMove = (e) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY, ...style }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

/* ==========================================================================
   6. TEXT SCRAMBLE / CHARACTER DECODE
   ========================================================================== */
export const ScrambleText = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 2;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

/* ==========================================================================
   7. SCROLL COUNTING ANIMATED COUNTER
   ========================================================================== */
export const AnimatedCounter = ({ target, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end)) return;

    const totalSteps = 40;
    const stepTime = (duration * 1000) / totalSteps;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

/* ==========================================================================
   8. ORBITAL SKILLS & TECH WALL SHOWCASE
   ========================================================================== */
export const OrbitalSkills = () => {
  const techStack = [
    { name: 'React', icon: '⚛️', category: 'Frontend' },
    { name: 'Next.js', icon: '▲', category: 'Frontend' },
    { name: 'JavaScript', icon: 'JS', category: 'Languages' },
    { name: 'Node.js', icon: '🟢', category: 'Backend' },
    { name: 'Express', icon: '🚂', category: 'Backend' },
    { name: 'Laravel', icon: '🔴', category: 'Backend' },
    { name: 'MongoDB', icon: '🍃', category: 'Database' },
    { name: 'MySQL', icon: '🐬', category: 'Database' },
    { name: 'AI / MCP', icon: '🤖', category: 'AI & Tools' }
  ];

  return (
    <div className="dev-glass-card dev-orbital-container" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
          Interactive Tech Stack & Constellation
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
          Hover & interact with full-stack frameworks, AI tools, and animation engines
        </p>
      </div>

      {/* Orbit Visualizer */}
      <div className="dev-orbit-stage">
        <div className="dev-orbit-nucleus">
          <div>Ayush Sood</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Stack Core</div>
        </div>

        {/* Orbit Ring 1 */}
        <div className="dev-orbit-ring dev-orbit-ring-1">
          <div className="dev-orbit-node" style={{ top: '-20px', left: '80px' }} title="React">⚛️</div>
          <div className="dev-orbit-node" style={{ bottom: '-20px', right: '80px' }} title="Node.js">🟢</div>
          <div className="dev-orbit-node" style={{ top: '80px', right: '-20px' }} title="Laravel">🔴</div>
        </div>

        {/* Orbit Ring 2 */}
        <div className="dev-orbit-ring dev-orbit-ring-2">
          <div className="dev-orbit-node" style={{ top: '20px', left: '-20px' }} title="AI & MCP">🤖</div>
          <div className="dev-orbit-node" style={{ bottom: '20px', left: '40px' }} title="MongoDB">🍃</div>
          <div className="dev-orbit-node" style={{ top: '140px', right: '-20px' }} title="Motion">🌊</div>
        </div>
      </div>

      {/* Interactive Tech Wall */}
      <div className="dev-tech-wall">
        {techStack.map((tech, idx) => (
          <div key={idx} className="dev-tech-wall-item">
            <span className="dev-tech-wall-icon">{tech.icon}</span>
            <span className="dev-tech-wall-name">{tech.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
