export function mapAvailabilityRule(r) {
  return {
    id:         r.id,
    resourceId: r.resource_id,
    ruleType:   r.rule_type,
    weekday:    Number(r.weekday),
    startTime:  r.start_time,
    endTime:    r.end_time,
    isActive:   r.is_active,
  };
}
