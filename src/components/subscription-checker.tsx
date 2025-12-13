
import { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubscriptionPlan } from '@/lib/types';
import subscriptionPlans from '@/lib/subscription-plans.json';

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan | null;
  hasAccess: (feature: string) => boolean;
  isLoaded: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const SubscriptionProvider: React.FC<{
  children: React.ReactNode;
  user: User | null;
}> = ({ children, user }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch user's subscription status from your backend
    // For this example, we'll just assign a default plan
    const defaultPlanId = 'plan_premium'; // Or 'plan_starter', 'plan_enterprise'
    const plan =
      subscriptionPlans.find((p) => p.id === defaultPlanId) || null;
    setCurrentPlan(plan);
    setIsLoaded(true);
  }, [user]);

  const hasAccess = (feature: string) => {
    // DEV ONLY: Allow access to all features for ease of development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return currentPlan?.features.includes(feature) ?? false;
  };

  return (
    <SubscriptionContext.Provider value={{ currentPlan, hasAccess, isLoaded }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
};

export const SubscriptionChecker: React.FC<{
  feature: string;
  children: (isAllowed: boolean) => React.ReactNode;
}> = ({ feature, children }) => {
  const { hasAccess } = useSubscription();
  return <>{children(hasAccess(feature))}</>;
};
