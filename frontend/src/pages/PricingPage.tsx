import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { PricingCard, UpgradeModal, FeatureComparisonTable } from '@/components/subscription';

interface Plan {
  name: string;
  price: string;
  features: string[];
}

interface CurrentSubscription {
  plan: string;
  status: string;
  expiry_date: string | null;
  remaining_analyses: number | null;
}

export const PricingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch plans
  const { data: plansData, isLoading: isPlansLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/plans');
      return res.data;
    },
  });

  // Fetch current subscription
  const { data: currentSub, isLoading: isSubLoading } = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/current');
      return res.data;
    },
  });

  // Upgrade mutation
  const upgradeMutation = useMutation<any, Error, string>({
    mutationFn: async (planName: string) => {
      const res = await apiClient.post('/subscription/upgrade', { plan: planName });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      setSuccessMessage(`Successfully updated plan to ${data.plan}!`);
      setSelectedPlan(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const handleUpgradeClick = (planName: string) => {
    setSelectedPlan(planName);
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      upgradeMutation.mutate(selectedPlan);
    }
  };

  if (isPlansLoading || isSubLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 relative">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-green-950 border border-green-800 text-sm text-green-300 shadow-lg animate-bounce">
          {successMessage}
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display sm:text-4xl">
          Upgrade your Guardian workspace
        </h2>
        <p className="text-sm text-slate-400">
          Unlock unlimited AI document scans, custom checklists, large file uploads, and prioritize your audits queue.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plansData?.plans.map((plan) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.price}
            features={plan.features}
            isCurrentPlan={currentSub?.plan.toUpperCase() === plan.name.toUpperCase()}
            onUpgrade={handleUpgradeClick}
            isLoading={upgradeMutation.isPending}
          />
        ))}
      </div>

      {/* Comparison table */}
      <div className="max-w-4xl mx-auto pt-4">
        <FeatureComparisonTable />
      </div>

      {/* Upgrade Confirmation Modal */}
      <UpgradeModal
        isOpen={selectedPlan !== null}
        planName={selectedPlan || ''}
        onClose={() => setSelectedPlan(null)}
        onConfirm={handleConfirmUpgrade}
        isLoading={upgradeMutation.isPending}
      />
    </div>
  );
};
