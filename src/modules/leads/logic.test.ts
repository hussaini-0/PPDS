import { describe, expect, it } from "vitest";

import {
  calculateQualificationScore,
  recommendPlan,
  suggestNextLeadStage,
} from "@/modules/leads/logic";

describe("lead logic", () => {
  it("calculates qualification score from answered questions", () => {
    const score = calculateQualificationScore(
      [
        { id: "q1", qualificationWeight: 2 },
        { id: "q2", qualificationWeight: 3 },
      ],
      [{ questionId: "q2", value: "yes" }],
    );

    expect(score).toBe(3);
  });

  it("recommends the highest-priority active plan", () => {
    const recommended = recommendPlan([
      { id: "a", recommendationPriority: 10, isActive: true },
      { id: "b", recommendationPriority: 30, isActive: false },
      { id: "c", recommendationPriority: 20, isActive: true },
    ]);

    expect(recommended?.id).toBe("c");
  });

  it("advances stage based on workflow state", () => {
    expect(
      suggestNextLeadStage({
        hasRecommendedPlan: false,
        awaitingPaymentProof: false,
        isConverted: false,
      }),
    ).toBe("QUALIFYING");
  });
});
