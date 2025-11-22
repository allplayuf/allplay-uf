import React, { useEffect, useRef } from 'react';

export default function Confetti({ duration = 3000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const colors = ['#2BA84A', '#F4743B', '#4169E1', '#F59E0B', '#FFFFFF'];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.vx = Math.random() * 4 - 2;
        this.vy = Math.random() * 5 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 8 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        // Oscillation
        this.x += Math.sin(this.y / 50);

        return this.y < canvas.height;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    const createParticles = () => {
      if (particles.length < 150) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      createParticles();
      
      particles = particles.filter(p => {
        p.draw();
        return p.update();
      });

      if (particles.length > 0 || Date.now() - startTime < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const startTime = Date.now();
    animate();

    const cleanup = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
    }, duration + 2000); // Allow particles to fall off screen

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(cleanup);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}