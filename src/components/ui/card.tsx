import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-50 dark:shadow-black/30",
        className,
      )}
      {...props}
    />
  );
}
