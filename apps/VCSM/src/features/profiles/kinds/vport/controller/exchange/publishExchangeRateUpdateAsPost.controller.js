import {
  resolveVportExchangeNameDAL,
  hasRecentExchangeRatePostDAL,
} from "@/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";

function formatRate(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(4) : "—";
}

function buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate }) {
  const name = exchangeName ?? "this exchange";
  const pair = `${baseCurrency}/${quoteCurrency}`;
  const rates = `Buy: ${formatRate(buyRate)} · Sell: ${formatRate(sellRate)}`;
  return `Exchange rates updated at ${name}\n\n${pair} — ${rates}`;
}

export async function publishExchangeRateUpdateAsPostController({
  actorId,
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
}) {
  if (!actorId) throw new Error("publishExchangeRateUpdateAsPost: actorId required");
  if (!baseCurrency || !quoteCurrency) return { published: false, reason: "missing_currencies" };

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const alreadyPosted = await hasRecentExchangeRatePostDAL({ actorId });
  if (alreadyPosted) return { published: false, reason: "dedup_throttle" };

  const exchangeName = await resolveVportExchangeNameDAL(actorId);
  const text = buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "exchange_rate_update",
    realm_id: realmId,
    media_url: null,
  });

  return { published: true, postId: created?.id ?? null };
}
