import { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadFull } from 'tsparticles';

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: false,
          background: {
            color: {
              value: '#000000',
            },
          },
          fpsLimit: 60,
          particles: {
            color: { value: '#ffffff' },
            number: {
              value: 50,
              density: { enable: true, area: 800 },
            },
            size: { value: 1.5 },
            move: {
              enable: true,
              speed: 0.2,
              random: true,
              direction: 'none',
              outModes: { default: 'out' },
            },
            opacity: { value: 0.3 },
          },
        }}
      />
    </div>
  );
}
