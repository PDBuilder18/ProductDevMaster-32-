import { Card, CardContent } from "@/components/ui/card";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Processing..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-sm mx-4">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">Processing with AI</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
