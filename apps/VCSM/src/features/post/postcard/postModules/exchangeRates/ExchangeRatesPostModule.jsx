import React from "react";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { ExchangeRatePairPanel } from "@/features/post/postcard/postModules/exchangeRates/ExchangeRatePairPanel";
import { parseExchangeRatesPostModule } from "@/features/post/postcard/postModules/exchangeRates/exchangeRatesPostModule.model";
import "@/features/post/postcard/postModules/exchangeRates/exchangeRatesPostModule.css";

export function ExchangeRatesPostModule({ text, payload = null, exchangeRoute }) {
  const data = parseExchangeRatesPostModule(text, payload);
  const { exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate } = data;

  if (!buyRate || !sellRate) {
    return <div className="post-module-fallback">{text}</div>;
  }

  return (
    <PostModuleFrame className="exchange-module" ariaLabel="Exchange rate display">
      <PostModuleHeader
        kicker="Currency exchange"
        title={exchangeName}
        meta={`${baseCurrency} / ${quoteCurrency}`}
      />

      <div className="exchange-module-market">
        <span>Live board</span>
        <strong>
          {baseCurrency} to {quoteCurrency}
        </strong>
      </div>

      <div className="exchange-module-grid">
        <ExchangeRatePairPanel tone="buy" label="We buy" rate={buyRate} quoteCurrency={quoteCurrency} />
        <ExchangeRatePairPanel tone="sell" label="We sell" rate={sellRate} quoteCurrency={quoteCurrency} />
      </div>

      <PostModuleCta to={exchangeRoute}>View exchange</PostModuleCta>
    </PostModuleFrame>
  );
}
