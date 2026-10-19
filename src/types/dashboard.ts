export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type AttentionQueueItem = {
  id: string;
  customerName: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  stage: string | null;
  waitingSince: string;
  recommendedAction: string | null;
};

export type DashboardSnapshot = {
  businessName: string;
  timezone: string;
  integrationMode: "mock" | "live";
  metrics: DashboardMetric[];
  attentionQueue: AttentionQueueItem[];
  topLeads: Array<{
    id: string;
    customerName: string;
    stage: string;
    intentScore: number;
    nextFollowUpAt: string | null;
  }>;
  subscriptionsExpiring: Array<{
    id: string;
    customerName: string;
    planName: string;
    expiryDate: string;
    status: string;
  }>;
};
