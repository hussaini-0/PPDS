export function safeDivide(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function calculateLeadConversionRate(convertedLeads: number, eligibleLeads: number) {
  return safeDivide(convertedLeads, eligibleLeads);
}

export function calculateAttributedRoas(revenue: number, spend: number) {
  return safeDivide(revenue, spend);
}

export function calculateFunnelDropoff(currentStep: number, previousStep: number) {
  if (previousStep === 0) {
    return 0;
  }

  return 1 - safeDivide(currentStep, previousStep);
}

export function calculateAverageRevenuePerUser(revenue: number, activeCustomers: number) {
  return safeDivide(revenue, activeCustomers);
}

export function calculateRenewalRiskRate(expiring: number, active: number) {
  return safeDivide(expiring, active + expiring);
}

export function calculateBotEscalationRate(escalated: number, botHandled: number) {
  return safeDivide(escalated, botHandled);
}
