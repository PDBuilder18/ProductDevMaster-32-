import { useState, useEffect } from "react";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CustomerData {
  customer_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_status: string;
  plan_name: string;
  subscribe_plan_name: string;
  actual_attempts: number;
  used_attempt: number;
}

interface CustomerAccessGateProps {
  children: React.ReactNode;
}

type AccessState = "loading" | "no_customer_id" | "not_found" | "inactive" | "expired" | "active";

export function CustomerAccessGate({ children }: CustomerAccessGateProps) {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/admin") || pathname === "/terms") {
      setAccessState("active");
      return;
    }

    if (import.meta.env.DEV) {
      setAccessState("active");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const customerIdParam = urlParams.get("customer_id");

    if (!customerIdParam) {
      setAccessState("no_customer_id");
      return;
    }

    setCustomerId(customerIdParam);
    checkCustomerAccess(customerIdParam);
  }, []);

  const checkCustomerAccess = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        setAccessState("not_found");
        return;
      }

      const data = result.data as CustomerData;
      setCustomerData(data);

      if (data.subscription_status === "expired") {
        setAccessState("expired");
      } else if (data.subscription_status === "inactive" || data.subscription_status === "cancelled") {
        setAccessState("inactive");
      } else if (data.subscription_status === "active") {
        setAccessState("active");
      } else {
        setAccessState("inactive");
      }
    } catch (error) {
      console.error("Error checking customer access:", error);
      setAccessState("not_found");
    }
  };

  if (accessState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Checking Access</h2>
            <p className="text-muted-foreground">Please wait while we verify your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessState === "no_customer_id") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Required</h2>
            <p className="text-muted-foreground">
              Please access this app through your Shopify store to use your subscription.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessState === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center" data-testid="customer-not-found">
            <Lock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Customer Not Found</h2>
            <p className="text-muted-foreground">
              No customer found with ID: {customerId}. Please check your customer ID and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessState === "inactive") {
    const remainingAttempts = customerData ? customerData.actual_attempts - customerData.used_attempt : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center" data-testid="subscription-inactive">
            <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Subscription Inactive</h2>
            <p className="text-muted-foreground mb-4">
              {customerData?.subscribe_plan_name === "Free" 
                ? `You've used all ${customerData?.actual_attempts} free attempts. Please upgrade to continue.`
                : "Your subscription is currently inactive. Please upgrade or renew to access the app."
              }
            </p>
            <Button 
              variant="default" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.parent.postMessage({ type: "UPGRADE_SUBSCRIPTION" }, "*")}
              data-testid="button-upgrade"
            >
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center" data-testid="subscription-expired">
            <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Subscription Expired</h2>
            <p className="text-muted-foreground mb-4">
              Your subscription has expired. Please renew to continue using the app.
            </p>
            <Button 
              variant="default"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.parent.postMessage({ type: "RENEW_SUBSCRIPTION" }, "*")}
              data-testid="button-renew"
            >
              Renew Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function useCustomerId(): string | null {
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setCustomerId(urlParams.get("customer_id"));
  }, []);

  return customerId;
}
