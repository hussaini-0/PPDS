import type { LeadStage, QualificationQuestion, SubscriptionPlan } from "@prisma/client";

export type QualificationAnswer = {
  questionId: string;
  value: string | number | boolean | string[];
};

export function calculateQualificationScore(
  questions: Array<Pick<QualificationQuestion, "id" | "qualificationWeight">>,
  answers: QualificationAnswer[],
) {
  const answeredIds = new Set(answers.map((answer) => answer.questionId));

  return questions.reduce((score, question) => {
    return answeredIds.has(question.id)
      ? score + question.qualificationWeight
      : score;
  }, 0);
}

export function suggestNextLeadStage({
  hasRecommendedPlan,
  awaitingPaymentProof,
  isConverted,
}: {
  hasRecommendedPlan: boolean;
  awaitingPaymentProof: boolean;
  isConverted: boolean;
}): LeadStage {
  if (isConverted) return "CONVERTED";
  if (awaitingPaymentProof) return "PAYMENT_INSTRUCTIONS_SENT";
  if (hasRecommendedPlan) return "PLAN_RECOMMENDED";
  return "QUALIFYING";
}

export function recommendPlan(
  plans: Array<Pick<SubscriptionPlan, "id" | "recommendationPriority" | "isActive">>,
) {
  return plans
    .filter((plan) => plan.isActive)
    .sort((a, b) => b.recommendationPriority - a.recommendationPriority)[0] ?? null;
}
