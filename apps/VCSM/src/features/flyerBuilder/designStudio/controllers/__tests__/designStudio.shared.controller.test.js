/**
 * Regression tests — designStudio.shared.controller
 *
 * ELEK-002 / VEN-DASH-003:
 * Caller-supplied documentId must be bound to the active ownerActorId before
 * designStudio page/export reads or writes continue.
 *
 * Run: npx vitest run src/features/flyerBuilder/designStudio/controller/__tests__/designStudio.shared.controller.test.js
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/flyerBuilder/designStudio/dal/designStudio.auth.dal", () => ({
  dalReadAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/features/flyerBuilder/designStudio/dal/designStudio.read.dal", () => ({
  dalReadActorOwnerRow: vi.fn(),
  dalReadDesignDocumentById: vi.fn(),
}));

import { dalReadAuthenticatedUserId } from "@/features/flyerBuilder/designStudio/dal/designStudio.auth.dal";
import {
  dalReadActorOwnerRow,
  dalReadDesignDocumentById,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.read.dal";
import { requireDesignDocumentOwnerAccess } from "@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller";

const OWNER_ACTOR_ID = "actor-vport-owner";
const OTHER_ACTOR_ID = "actor-vport-other";
const DOCUMENT_ID = "document-1";
const USER_ID = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
  dalReadAuthenticatedUserId.mockResolvedValue(USER_ID);
  dalReadActorOwnerRow.mockResolvedValue({
    actor_id: OWNER_ACTOR_ID,
    user_id: USER_ID,
  });
});

describe("requireDesignDocumentOwnerAccess", () => {
  it("returns the design document when it belongs to the active owner actor", async () => {
    const documentRow = {
      id: DOCUMENT_ID,
      owner_actor_id: OWNER_ACTOR_ID,
      is_deleted: false,
    };
    dalReadDesignDocumentById.mockResolvedValue(documentRow);

    await expect(
      requireDesignDocumentOwnerAccess({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).resolves.toEqual(documentRow);

    expect(dalReadActorOwnerRow).toHaveBeenCalledWith({
      actorId: OWNER_ACTOR_ID,
      userId: USER_ID,
    });
    expect(dalReadDesignDocumentById).toHaveBeenCalledWith(DOCUMENT_ID);
  });

  it("rejects a caller-supplied documentId owned by another actor", async () => {
    dalReadDesignDocumentById.mockResolvedValue({
      id: DOCUMENT_ID,
      owner_actor_id: OTHER_ACTOR_ID,
      is_deleted: false,
    });

    await expect(
      requireDesignDocumentOwnerAccess({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).rejects.toThrow("Design document does not belong to this owner.");
  });

  it("rejects missing or deleted documents", async () => {
    dalReadDesignDocumentById.mockResolvedValue(null);

    await expect(
      requireDesignDocumentOwnerAccess({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).rejects.toThrow("Design document not found.");

    dalReadDesignDocumentById.mockResolvedValue({
      id: DOCUMENT_ID,
      owner_actor_id: OWNER_ACTOR_ID,
      is_deleted: true,
    });

    await expect(
      requireDesignDocumentOwnerAccess({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).rejects.toThrow("Design document not found.");
  });
});
