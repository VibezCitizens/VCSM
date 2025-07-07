import ParticleBackground from './components/ParticleBackground';

export default function VoidScreen() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 p-6 text-center">
        <h1 className="text-3xl font-bold"></h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-purple-800" />
          The Architect is currently weaving thresholds...
        </p>
        <p className="mt-2 text-sm italic text-neutral-500">
          Access will be granted when the veil thins.
        </p>
      </div>
    </div>
  );
}
