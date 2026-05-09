function maybeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasUsableCoordinates(value) {
  const lat = maybeNumber(value?.lat);
  const lon = maybeNumber(value?.lon ?? value?.lng);
  if (lat == null || lon == null) return false;
  if (lat === 0 && lon === 0) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestLiveTrazeCity({ lat, lng }, locationOptions = []) {
  const latitude = maybeNumber(lat);
  const longitude = maybeNumber(lng);
  if (latitude == null || longitude == null) return null;

  const result = locationOptions
    .filter(hasUsableCoordinates)
    .reduce((best, option) => {
      const optionLat = maybeNumber(option.lat);
      const optionLon = maybeNumber(option.lon ?? option.lng);
      const distanceKm = haversineKm(latitude, longitude, optionLat, optionLon);
      return best === null || distanceKm < best.distanceKm
        ? { option, distanceKm }
        : best;
    }, null);

  return result ? { ...result.option, distanceKm: result.distanceKm } : null;
}
