// VportGasPricesScreen.jsx
export function VportGasPricesScreen({ actorId: actorIdProp }) {
  const params = useParams();
  const { identity } = useIdentity(); // ✅ destructure, pass actor

  const actorId = useMemo(() => {
    return actorIdProp ?? params?.actorId ?? null;
  }, [actorIdProp, params]);

  if (!actorId) {
    return <div className="p-6 text-sm text-neutral-400">Invalid station.</div>;
  }

  return (
    <div className="p-6">
      <VportGasPricesView actorId={actorId} identity={identity} />
    </div>
  );
}