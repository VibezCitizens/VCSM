import React from "react";

export function ExchangeRatePairPanel({ tone, label, rate, quoteCurrency }) {
  return (
    <article className={`exchange-module-rate exchange-module-${tone}`}>
      <div className="exchange-module-rate-label">{label}</div>
      <div className="exchange-module-rate-value">{rate}</div>
      <div className="exchange-module-rate-caption">
        {quoteCurrency ? `${quoteCurrency} per 1` : "official rate"}
      </div>
    </article>
  );
}
