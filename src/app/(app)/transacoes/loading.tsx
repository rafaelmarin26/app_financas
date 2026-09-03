import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Card className="divide-y divide-border">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </Card>
    </div>
  );
}
