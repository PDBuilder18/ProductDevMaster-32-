import { useState, useEffect, createContext, useContext } from "react";
import { Lock, AlertCircle, Loader2, Crown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface CustomerContextType {
  customer: CustomerData | null;
  isDevMode: boolean;
}

const CustomerContext = createContext<CustomerContextType>({ customer: null, isDevMode: false });

export function useCustomer() {
  return useContext(CustomerContext);
}

interface CustomerAccessGateProps {
  children: React.ReactNode;
}

type AccessState = "loading" | "no_customer_id" | "not_found" | "inactive" | "expired" | "active";

function CustomerInfoBanner({ customer, isDevMode }: { customer: CustomerData | null; isDevMode: boolean }) {
  if (isDevMode && !customer) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-200">Development Mode</span>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const isFree = customer.subscribe_plan_name === "Free";
  const remainingAttempts = customer.actual_attempts - customer.used_attempt;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {isFree ? (
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800" data-testid="badge-plan-free">
              <Sparkles className="w-3 h-3 mr-1" />
              Free Plan
            </Badge>
          ) : (
            <Badge className="bg-purple-600" data-testid="badge-plan-paid">
              <Crown className="w-3 h-3 mr-1" />
              {customer.subscribe_plan_name}
            </Badge>
          )}
          {customer.first_name && (
            <span className="text-sm text-muted-foreground">
              Welcome, {customer.first_name}!
            </span>
          )}
        </div>
        {isFree && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground" data-testid="text-remaining-attempts">
              {remainingAttempts} of {customer.actual_attempts} uses remaining
            </span>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => window.parent.postMessage({ type: "UPGRADE_SUBSCRIPTION" }, "*")}
              data-testid="button-upgrade-banner"
            >
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerAccessGate({ children }: CustomerAccessGateProps) {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/admin") || pathname === "/terms") {
      setAccessState("active");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const customerIdParam = urlParams.get("customer_id");
    
    const isInIframe = window.self !== window.top;
    
    if (import.meta.env.DEV && isInIframe && !customerIdParam) {
      setIsDevMode(true);
      setAccessState("active");
      return;
    }

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

  return (
    <CustomerContext.Provider value={{ customer: customerData, isDevMode }}>
      <div className="flex flex-col min-h-screen">
        <CustomerInfoBanner customer={customerData} isDevMode={isDevMode} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </CustomerContext.Provider>
  );
}

export function useCustomerId(): string | null {
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setCustomerId(urlParams.get("customer_id"));
  }, []);

  return customerId;
}
