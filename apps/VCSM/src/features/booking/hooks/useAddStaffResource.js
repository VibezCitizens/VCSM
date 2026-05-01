import { useCallback, useState } from "react";
import { createLocationResource } from "@booking";

export default function useAddStaffResource() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState(null);

  const addStaff = useCallback(async ({ requestActorId, locationId, resourceName, memberActorId = null, sortOrder = 0 }) => {
    setIsPending(true);
    setError(null);
    try {
      const resource = await createLocationResource({
        requestActorId,
        locationId,
        resourceName,
        resourceType: "staff",
        memberActorId,
        sortOrder,
      });
      return resource;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { addStaff, isPending, error };
}
