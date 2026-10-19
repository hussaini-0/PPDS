import { Card } from "@/components/ui/card";
import type { DashboardMetric } from "@/types/dashboard";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
      <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
      <p className="text-sm text-zinc-600">{metric.helper}</p>
    </Card>
  );
}
