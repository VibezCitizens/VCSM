export function parseExchangeRatesPostModule(text, payload = null) {
  const exchangeName = (text ?? "").replace(/^Exchange rates updated at\s*/i, "").split("\n")[0].trim();

  if (payload?.buyRate != null) {
    return {
      exchangeName,
      baseCurrency: payload.baseCurrency,
      quoteCurrency: payload.quoteCurrency,
      buyRate: payload.buyRate,
      sellRate: payload.sellRate,
    };
  }

  const parts = (text ?? "").split("\n\n");
  const rateLine = (parts[1] ?? "").trim();
  const match = rateLine.match(/^([A-Z]{3})\/([A-Z]{3})\s+—\s+Buy:\s+([\d.]+)\s+·\s+Sell:\s+([\d.]+)$/);

  if (!match) {
    return {
      exchangeName,
      baseCurrency: null,
      quoteCurrency: null,
      buyRate: null,
      sellRate: null,
    };
  }

  return {
    exchangeName,
    baseCurrency: match[1],
    quoteCurrency: match[2],
    buyRate: match[3],
    sellRate: match[4],
  };
}
