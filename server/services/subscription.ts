import { storage } from "../storage";
import type { Customer } from "@shared/schema";

// Free plan configuration constants
const FREE_PLAN_CONFIG = {
  planName: "Free",
  subscribePlanName: "Free",
  subscriptionStatus: "active" as const,
  actualAttempts: 3,
  usedAttempt: 0,
  subscriptionPlanPrice: 0,
};

// Subscription status response type
export interface SubscriptionStatusResponse {
  status: "active" | "inactive";
  remaining_attempts: number;
  plan_name: string | null;
  used_attempt: number;
  actual_attempts: number;
}

// Attempt completion result type
export interface AttemptCompletionResult {
  success: boolean;
  message: string;
  subscription_status: string;
  used_attempt: number;
  actual_attempts: number;
  remaining_attempts: number;
}

// Check if a customer's subscription is active based on attempts and status
export function isSubscriptionActive(customer: Customer): boolean {
  if (!customer.subscriptionStatus || customer.subscriptionStatus !== "active") {
    return false;
  }
  
  const usedAttempt = customer.usedAttempt ?? 0;
  const actualAttempts = customer.actualAttempts ?? 0;
  
  return usedAttempt < actualAttempts;
}

// Get default Free plan values for new customers without paid subscriptions
export function getFreePlanDefaults(): typeof FREE_PLAN_CONFIG {
  return { ...FREE_PLAN_CONFIG };
}

// Apply Free plan defaults to customer data if no paid subscription exists
export function applyFreePlanIfNeeded(customerData: any): any {
  const hasPaidSubscription = 
    customerData.subscriptionId || 
    (customerData.planName && customerData.planName !== "Free") ||
    (customerData.subscribePlanName && customerData.subscribePlanName !== "Free");

  if (hasPaidSubscription) {
    return customerData;
  }

  // Apply Free plan defaults for customers without paid subscriptions
  return {
    ...customerData,
    planName: customerData.planName ?? FREE_PLAN_CONFIG.planName,
    subscribePlanName: customerData.subscribePlanName ?? FREE_PLAN_CONFIG.subscribePlanName,
    subscriptionStatus: customerData.subscriptionStatus ?? FREE_PLAN_CONFIG.subscriptionStatus,
    actualAttempts: customerData.actualAttempts ?? FREE_PLAN_CONFIG.actualAttempts,
    usedAttempt: customerData.usedAttempt ?? FREE_PLAN_CONFIG.usedAttempt,
    subscriptionPlanPrice: customerData.subscriptionPlanPrice ?? FREE_PLAN_CONFIG.subscriptionPlanPrice,
  };
}

// Get subscription status for a customer
export async function getSubscriptionStatus(customerId: string): Promise<SubscriptionStatusResponse | null> {
  const customer = await storage.getCustomer(customerId);
  
  if (!customer) {
    return null;
  }

  const usedAttempt = customer.usedAttempt ?? 0;
  const actualAttempts = customer.actualAttempts ?? 0;
  const remainingAttempts = Math.max(0, actualAttempts - usedAttempt);
  
  const isActive = isSubscriptionActive(customer);

  return {
    status: isActive ? "active" : "inactive",
    remaining_attempts: remainingAttempts,
    plan_name: customer.planName,
    used_attempt: usedAttempt,
    actual_attempts: actualAttempts,
  };
}

// Complete a user attempt after finishing all 12 steps
export async function completeUserAttempt(customerId: string): Promise<AttemptCompletionResult> {
  const customer = await storage.getCustomer(customerId);
  
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Check if subscription is active before allowing attempt completion
  if (customer.subscriptionStatus !== "active") {
    const usedAttempt = customer.usedAttempt ?? 0;
    const actualAttempts = customer.actualAttempts ?? 0;
    return {
      success: false,
      message: "Subscription is not active. Cannot complete attempt.",
      subscription_status: customer.subscriptionStatus ?? "inactive",
      used_attempt: usedAttempt,
      actual_attempts: actualAttempts,
      remaining_attempts: Math.max(0, actualAttempts - usedAttempt),
    };
  }

  const currentUsedAttempt = customer.usedAttempt ?? 0;
  const actualAttempts = customer.actualAttempts ?? 0;

  // Prevent exceeding actual attempts (safety check)
  if (currentUsedAttempt >= actualAttempts) {
    return {
      success: false,
      message: "No remaining attempts available.",
      subscription_status: "inactive",
      used_attempt: currentUsedAttempt,
      actual_attempts: actualAttempts,
      remaining_attempts: 0,
    };
  }

  // Increment used attempt
  const newUsedAttempt = currentUsedAttempt + 1;
  
  // Determine new subscription status
  const newSubscriptionStatus = newUsedAttempt >= actualAttempts ? "inactive" : "active";

  // Update customer with new attempt count and status
  const updatedCustomer = await storage.updateCustomer(customerId, {
    usedAttempt: newUsedAttempt,
    subscriptionStatus: newSubscriptionStatus as "active" | "paused" | "cancelled" | "expired",
  });

  const remainingAttempts = Math.max(0, actualAttempts - newUsedAttempt);

  return {
    success: true,
    message: newSubscriptionStatus === "inactive" 
      ? "Attempt completed. No remaining attempts. Subscription is now inactive."
      : `Attempt completed. ${remainingAttempts} attempt(s) remaining.`,
    subscription_status: newSubscriptionStatus,
    used_attempt: newUsedAttempt,
    actual_attempts: actualAttempts,
    remaining_attempts: remainingAttempts,
  };
}

// Update subscription from Shopify webhook (paid subscription)
export async function updatePaidSubscription(
  customerId: string, 
  subscriptionData: {
    subscriptionId: string;
    planName: string;
    subscriptionInterval?: string;
    subscriptionPlanPrice?: number;
    actualAttempts?: number;
  }
): Promise<Customer> {
  const customer = await storage.getCustomer(customerId);
  
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Update with paid subscription details, resetting status to active
  const updatedCustomer = await storage.updateCustomer(customerId, {
    subscriptionId: subscriptionData.subscriptionId,
    planName: subscriptionData.planName,
    subscribePlanName: subscriptionData.planName,
    subscriptionInterval: subscriptionData.subscriptionInterval,
    subscriptionPlanPrice: subscriptionData.subscriptionPlanPrice,
    subscriptionStatus: "active",
    // Reset attempts based on new plan (if provided) or keep existing
    actualAttempts: subscriptionData.actualAttempts ?? customer.actualAttempts ?? undefined,
    // Reset used attempts when upgrading
    usedAttempt: 0,
  });

  return updatedCustomer;
}

export const subscriptionService = {
  isSubscriptionActive,
  getFreePlanDefaults,
  applyFreePlanIfNeeded,
  getSubscriptionStatus,
  completeUserAttempt,
  updatePaidSubscription,
};
