export function canAdvanceBookingStep(name, { dataReady, hasBarbers, hasAvailabilityRules, hasUpcomingSlots, selectedDateKey, selectedSlot, clientName, slotsByDate }) {
  switch (name) {
    case "service":
      return dataReady && (hasBarbers ? true : hasAvailabilityRules && hasUpcomingSlots);
    case "barber": return true;
    case "date":
      return Boolean(selectedDateKey) && (slotsByDate[selectedDateKey]?.length ?? 0) > 0;
    case "time":    return Boolean(selectedSlot);
    case "details": return clientName.trim().length > 0;
    default:        return true;
  }
}
