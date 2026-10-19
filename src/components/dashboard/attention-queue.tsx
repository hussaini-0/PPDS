import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AttentionQueueItem } from "@/types/dashboard";

const toneMap = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
  URGENT: "danger",
} as const;

export function AttentionQueue({
  items,
}: {
  items: AttentionQueueItem[];
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Owner attention queue</h2>
          <p className="text-sm text-zinc-600">
            This queue is prioritized ahead of secondary reporting.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-medium">{item.customerName}</p>
              <Badge tone={toneMap[item.priority]}>{item.priority}</Badge>
              {item.stage ? <Badge>{item.stage}</Badge> : null}
            </div>
            <p className="mt-3 text-sm text-zinc-700">{item.reason}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span>Waiting since {item.waitingSince}</span>
              {item.recommendedAction ? <span>{item.recommendedAction}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
