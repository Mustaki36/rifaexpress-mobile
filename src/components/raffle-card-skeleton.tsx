
"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RaffleCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full" />
        <div className="p-6 pb-2">
            <Skeleton className="h-6 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 p-6 pt-0">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
