import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { SubscriptionStatus } from '@/components/subscription';

interface CurrentSubscription {
  plan: string;
  status: string;
  expiry_date: string | null;
  remaining_analyses: number | null;
  demo_mode?: boolean;
}

export const SubscriptionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch current subscription
  const { data: subscription, isLoading: isSubLoading } = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/subscription/current');
      return res.data;
    },
  });

  // Cancel subscription mutation (Downgrades to FREE) - kept for future release
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

  if (isSubLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

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
            plan={subscription.demo_mode ? "Demo Version" : subscription.plan}
            status={subscription.demo_mode ? "All Features Unlocked" : subscription.status}
            renewalDate={subscription.demo_mode ? null : subscription.expiry_date}
            onCancel={handleCancelClick}
            isCancelling={cancelMutation.isPending}
          />
        )}

        {/* Plans list */}
        <div className="space-y-4 pt-4 border-t border-slate-800/40">
          <h3 className="text-lg font-semibold text-slate-200 font-display">Available Plans</h3>
          <div className="p-4 rounded-lg bg-green-950/40 border border-green-900 text-green-400 text-xs font-semibold leading-relaxed shadow-lg">
            This MVP provides unrestricted access to all features. Paid plans will be introduced in a future release.
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Free */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">Free</h4>
                <div className="text-xl font-extrabold text-white">₹0 <span className="text-slate-500 text-xs font-normal">/ month</span></div>
                <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <li>✓ 10 AI analyses per month</li>
                  <li>✓ Basic OCR</li>
                  <li>✓ AI Summary</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-950 border border-slate-850 text-slate-400 font-semibold rounded text-xs cursor-not-allowed">
                Your Current Plan
              </button>
            </div>

            {/* Pro (Coming Soon) */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">Pro (Coming Soon)</h4>
                <div className="text-xl font-extrabold text-white">₹299 <span className="text-slate-500 text-xs font-normal">/ month</span></div>
                <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <li>✓ Unlimited analyses</li>
                  <li>✓ Advanced OCR</li>
                  <li>✓ Priority processing</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-950 border border-slate-850 text-slate-400 font-semibold rounded text-xs cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            {/* Enterprise (Coming Soon) */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">Enterprise (Coming Soon)</h4>
                <div className="text-xl font-extrabold text-white">Custom</div>
                <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <li>✓ Custom checklists</li>
                  <li>✓ Dedicated AI models</li>
                  <li>✓ API Access</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-950 border border-slate-850 text-slate-400 font-semibold rounded text-xs cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
