// src/features/void/VoidScreen.jsx
export default function VoidScreen() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-12 p-6 text-center"> {/* pt-12 is redundant if RootLayout already adds it */}
        <p className="mx-auto max-w-sm text-left inline-flex items-start gap-2">
          <span className="mt-2 inline-block w-2 h-2 rounded-full bg-purple-500" />
          <span className="leading-6">
            The Architect is currently weaving thresholds...
            <br />
            <span className="text-neutral-400 italic block mt-2">
              Access will be granted when the veil thins.
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}
