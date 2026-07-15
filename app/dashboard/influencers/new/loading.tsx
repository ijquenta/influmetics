import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewInfluencerLoading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Skeleton className="h-8 w-48 mb-2" />
            <Card className="max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-3 w-56" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-32 rounded-md" />
                </CardContent>
            </Card>
        </div>
    );
}
