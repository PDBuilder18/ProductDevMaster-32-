import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

interface Feedback {
  id: number;
  sessionId: string;
  rating: number;
  improvements: string | null;
  mostValuable: string | null;
  wouldRecommend: boolean | null;
  recommendationReason: string | null;
  createdAt: string;
}

export function AdminFeedbackPage() {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["/api/feedback"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/feedback", undefined);
      return res.json() as Promise<Feedback[]>;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">User Feedback Dashboard</h1>
        <p className="text-gray-600 mt-2">Review feedback from users who completed the workflow</p>
      </div>

      {feedback && feedback.length > 0 ? (
        <div className="grid gap-6">
          {feedback.map((item) => (
            <Card key={item.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Session: {item.sessionId.slice(0, 8)}...
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="outline">{item.rating}/5</Badge>
                  </div>
                </div>
                <CardDescription>
                  {format(new Date(item.createdAt), "PPP 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.wouldRecommend !== null && (
                  <div className="flex items-center gap-2">
                    {item.wouldRecommend ? (
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {item.wouldRecommend ? "Would recommend" : "Would not recommend"}
                    </span>
                  </div>
                )}

                {item.mostValuable && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Most Valuable:</h4>
                    <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-md">
                      {item.mostValuable}
                    </p>
                  </div>
                )}

                {item.improvements && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Suggested Improvements:</h4>
                    <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-md">
                      {item.improvements}
                    </p>
                  </div>
                )}

                {item.recommendationReason && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Recommendation Reason:</h4>
                    <p className="text-gray-700 text-sm bg-green-50 p-3 rounded-md">
                      {item.recommendationReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
            <p className="text-gray-600">
              User feedback will appear here once users complete the workflow and submit their reviews.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}