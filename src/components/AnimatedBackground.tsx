import { useEffect, useRef, memo } from 'react';

const AnimatedBackground = memo(function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Space particles
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    // Shooting stars
    const shootingStars: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      opacity: number;
      life: number;
      maxLife: number;
    }> = [];

    // Twinkling stars (static stars that pulse)
    const twinklingStars: Array<{
      x: number;
      y: number;
      radius: number;
      baseOpacity: number;
      twinklePhase: number;
      twinkleSpeed: number;
    }> = [];

    // Create visible particles with space theme - orange focused (reduced for performance)
    const colors = ['#F97316', '#FB923C', '#FDBA74'];
    const particleCount = Math.min(35, Math.floor((canvas.width * canvas.height) / 30000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.4,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.4 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Create twinkling stars
    const twinkleCount = 20;
    for (let i = 0; i < twinkleCount; i++) {
      twinklingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 0.8 + 0.3,
        baseOpacity: Math.random() * 0.3 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // Function to create a new shooting star
    const createShootingStar = () => {
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y, vx, vy;
      
      const speed = Math.random() * 8 + 12; // Shooting star speed
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // Random angle
      
      if (side === 0) { // Top
        x = Math.random() * canvas.width;
        y = -10;
        vx = Math.sin(angle) * speed;
        vy = Math.cos(angle) * speed;
      } else if (side === 1) { // Right
        x = canvas.width + 10;
        y = Math.random() * canvas.height;
        vx = -Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else if (side === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 10;
        vx = Math.sin(angle) * speed;
        vy = -Math.cos(angle) * speed;
      } else { // Left
        x = -10;
        y = Math.random() * canvas.height;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }
      
      shootingStars.push({
        x,
        y,
        vx,
        vy,
        length: Math.random() * 40 + 60,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 80,
      });
    };

    // Create initial shooting stars
    for (let i = 0; i < 2; i++) {
      setTimeout(() => createShootingStar(), i * 2000);
    }

    // Periodically create new shooting stars
    const shootingStarInterval = setInterval(() => {
      if (shootingStars.length < 3) {
        createShootingStar();
      }
    }, 3000 + Math.random() * 4000);

    // Animation loop with frame throttling
    let animationFrameId: number;
    let lastFrameTime = 0;
    const targetFPS = 30; // Target 30 FPS instead of 60
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw black background with very subtle gradient
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.2, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 1.5
      );
      gradient.addColorStop(0, 'rgba(5, 5, 8, 1)');
      gradient.addColorStop(0.5, 'rgba(2, 2, 4, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle orange nebula glow
      const nebulaGradient = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.8, 0,
        canvas.width * 0.7, canvas.height * 0.8, canvas.width * 0.8
      );
      nebulaGradient.addColorStop(0, 'rgba(249, 115, 22, 0.03)');
      nebulaGradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.015)');
      nebulaGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with visible glow (optimized - reduced shadow)
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1;

      // Update and draw twinkling stars
      twinklingStars.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
        const opacity = star.baseOpacity * twinkle;
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FB923C';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#FB923C';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update and draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life++;
        star.opacity = 1 - (star.life / star.maxLife);
        
        // Remove if off screen or dead
        if (star.life >= star.maxLife || 
            star.x < -100 || star.x > canvas.width + 100 ||
            star.y < -100 || star.y > canvas.height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }
        
        // Draw shooting star with trail
        const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
        const trailX = star.x - (star.vx / speed) * star.length;
        const trailY = star.y - (star.vy / speed) * star.length;
        
        const gradient = ctx.createLinearGradient(star.x, star.y, trailX, trailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.3, `rgba(251, 146, 60, ${star.opacity * 0.8})`);
        gradient.addColorStop(0.7, `rgba(249, 115, 22, ${star.opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(249, 115, 22, 0)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(trailX, trailY);
        ctx.stroke();
        
        // Draw bright head of shooting star
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FB923C';
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;

      // Draw connecting lines between nearby particles (restored visibility)
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const otherParticle = particles[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < 22500) { // 150^2 to avoid sqrt
            const distance = Math.sqrt(distanceSq);
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            // Increased opacity for better visibility (0.5 instead of 0.15)
            ctx.globalAlpha = (1 - distance / 150) * 0.5;
            // Increased line width for better visibility
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      clearInterval(shootingStarInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ 
        background: '#000000',
        willChange: 'contents'
      }}
    />
  );
});

export default AnimatedBackground;

