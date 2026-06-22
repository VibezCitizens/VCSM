// Adapter boundary: exposes locksmith-domain controllers to dashboard consumers.
// Do not import locksmith controllers directly from profiles internals — use this adapter.
export { ctrlSavePortfolioDetail } from "@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller";
export { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller";
