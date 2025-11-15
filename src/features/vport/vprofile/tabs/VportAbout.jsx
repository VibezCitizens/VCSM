// src/features/vport/vprofile/tabs/VportAbout.jsx
export default function VportAbout({ vport }) {
  return (
    <div className="px-6 py-6 text-neutral-200 leading-relaxed">
      {vport?.bio ? (
        <p>{vport.bio}</p>
      ) : (
        <p className="text-neutral-500">No information yet.</p>
      )}
    </div>
  );
}
