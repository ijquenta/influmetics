import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalysisLoading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-9 w-32" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-3 w-36" />
                                    <Skeleton className="h-8 w-full rounded-md" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
