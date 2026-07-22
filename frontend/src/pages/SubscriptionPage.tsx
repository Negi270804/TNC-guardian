import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api-client';
import { SubscriptionStatus, UsageCard } from '@/components/subscription';

interface CurrentSubscription {
  plan: string;
  status: string;
  expiry_date: string | null;
  remaining_analyses: number | null;
}

interface UsageInfo {
  analysis_count: number;
  storage_used: number;
  remaining_analyses: number | null;
  monthly_limits: {
    analyses: number | null;
    upload_size: number;
  };
}

export const SubscriptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch current subscription
  const { data: subscription, isLoading: isSubLoading } = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/current');
      return res.data;
    },
  });

  // Fetch current usage stats
  const { data: usage, isLoading: isUsageLoading } = useQuery<UsageInfo>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/usage');
      return res.data;
    },
  });

  // Cancel subscription mutation (Downgrades to FREE)
  const cancelMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      const res = await apiClient.post('/subscription/cancel');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      setToastMessage('Subscription cancelled. Downgraded to Free tier.');
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const handleCancelClick = () => {
    if (window.confirm('Are you sure you want to cancel your Pro subscription? You will be downgraded to the Free plan immediately.')) {
      cancelMutation.mutate();
    }
  };

  const handleUpgradeRedirect = () => {
    navigate('/pricing');
  };

  if (isSubLoading || isUsageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const isPro = subscription?.plan.toUpperCase() === 'PRO';

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md bg-yellow-950 border border-yellow-800 text-sm text-yellow-300 shadow-lg">
          {toastMessage}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-100 font-display">Subscription & Billing</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your active billing tier parameters and track monthly usage stats.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Plan Status Card */}
        {subscription && (
          <SubscriptionStatus
            plan={subscription.plan}
            status={subscription.status}
            renewalDate={subscription.expiry_date}
            onCancel={handleCancelClick}
            isCancelling={cancelMutation.isPending}
          />
        )}

        {/* Usage Card */}
        {usage && (
          <UsageCard
            analysisCount={usage.analysis_count}
            storageUsed={usage.storage_used}
            remainingAnalyses={usage.remaining_analyses}
            analysesLimit={usage.monthly_limits.analyses}
            uploadSizeLimit={usage.monthly_limits.upload_size}
          />
        )}

        {/* Call-to-action upgrade box if Free */}
        {!isPro && (
          <div className="p-6 rounded-xl border border-green-950 bg-gradient-to-r from-slate-900 to-green-950/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Ready to unlock premium capabilities?</h4>
              <p className="text-xs text-slate-400 max-w-lg">
                Upgrade to the PRO plan for unlimited document audits, advanced layout-aware OCR parsing, priority processing support, and larger uploads limits up to 25MB.
              </p>
            </div>
            <button
              onClick={handleUpgradeRedirect}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-500 font-semibold text-white text-sm rounded shadow-lg transition"
            >
              View Pricing Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
