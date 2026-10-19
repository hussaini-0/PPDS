import type { LeadStage } from "@prisma/client";

export type FollowUpEligibilityInput = {
  leadStage: LeadStage;
  expectedStage: LeadStage;
  convertedAt: Date | null;
  lostAt: Date | null;
  marketingOptIn: boolean;
  marketingOptOutAt: Date | null;
  humanTakeover: boolean;
  complaintState: boolean;
  lastInboundMessageAt: Date | null;
  scheduledAt: Date;
  serviceWindowExpiresAt: Date | null;
  requiresTemplate: boolean;
  templateAvailable: boolean;
  followUpCount: number;
  maxFollowUps: number;
};

export function evaluateFollowUpEligibility(input: FollowUpEligibilityInput) {
  if (input.convertedAt) return { eligible: false, reason: "Lead already converted." };
  if (input.lostAt) return { eligible: false, reason: "Lead is already lost." };
  if (input.leadStage !== input.expectedStage) {
    return { eligible: false, reason: "Lead is no longer in the expected stage." };
  }
  if (!input.marketingOptIn || input.marketingOptOutAt) {
    return { eligible: false, reason: "Customer is not opted in for marketing follow-ups." };
  }
  if (input.humanTakeover) return { eligible: false, reason: "Human takeover is active." };
  if (input.complaintState) return { eligible: false, reason: "Conversation is in complaint state." };
  if (input.lastInboundMessageAt && input.lastInboundMessageAt > input.scheduledAt) {
    return { eligible: false, reason: "Customer replied after the follow-up was scheduled." };
  }
  if (input.followUpCount >= input.maxFollowUps) {
    return { eligible: false, reason: "Maximum follow-ups reached." };
  }
  if (input.requiresTemplate && !input.templateAvailable) {
    return { eligible: false, reason: "Required WhatsApp template is not available." };
  }
  if (!input.requiresTemplate && (!input.serviceWindowExpiresAt || input.serviceWindowExpiresAt < new Date())) {
    return { eligible: false, reason: "Free-form service window is closed." };
  }

  return { eligible: true, reason: "Follow-up is eligible." };
}

export function getDefaultFollowUpDelayMinutes(triggerType: string) {
  if (triggerType === "PAYMENT_PROOF_MISSING") return 24 * 60;
  if (triggerType === "PLAN_RECOMMENDED_NO_REPLY") return 12 * 60;
  if (triggerType === "QUALIFICATION_NO_REPLY") return 6 * 60;
  return 24 * 60;
}

export function buildFollowUpMessage(triggerType: string) {
  if (triggerType === "PAYMENT_PROOF_MISSING") {
    return "Just checking in. If you have made the payment, please send the proof here so the owner can verify it.";
  }

  if (triggerType === "PLAN_RECOMMENDED_NO_REPLY") {
    return "Do you want to proceed with the recommended plan? Reply with pay and I will resend the payment instructions.";
  }

  if (triggerType === "QUALIFICATION_NO_REPLY") {
    return "I still need your answer to recommend the right subscription plan.";
  }

  return "Checking in to see if you still need help with your subscription.";
}
