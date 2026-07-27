import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { SubscriptionStatus } from '@/components/subscription';
import { API_ROUTES } from '@/config/api-routes';

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
      const res = await apiClient.get(API_ROUTES.SUBSCRIPTION.CURRENT);
      return res.data;
    },
  });

  // Cancel subscription mutation (Downgrades to FREE) - kept for future release
  const cancelMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      const res = await apiClient.post(API_ROUTES.SUBSCRIPTION.CANCEL);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative fade-in">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-white border border-brand-200 text-sm font-semibold text-brand-700 shadow-xl">
          {toastMessage}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Subscription & Billing</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your active billing tier parameters and track monthly usage stats.</p>
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
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 font-display">Available Plans</h3>
          
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold leading-relaxed shadow-sm">
            This MVP provides unrestricted access to all features. Paid plans will be introduced in a future release.
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Free */}
            <div className="p-6 bg-white border border-brand-200/80 rounded-2xl flex flex-col justify-between shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Free</h4>
                <div className="text-2xl font-extrabold text-slate-900">₹0 <span className="text-slate-400 text-xs font-semibold">/ month</span></div>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1.5 font-medium">
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> 10 AI analyses per month</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Basic OCR</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> AI Summary</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-50 border border-slate-200 text-slate-400 font-semibold rounded-lg text-xs cursor-not-allowed">
                Your Current Plan
              </button>
            </div>

            {/* Pro (Coming Soon) */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Pro (Coming Soon)</h4>
                <div className="text-2xl font-extrabold text-slate-900">₹299 <span className="text-slate-400 text-xs font-semibold">/ month</span></div>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1.5 font-medium">
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Unlimited analyses</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Advanced OCR</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Priority processing</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-50 border border-slate-200 text-slate-400 font-semibold rounded-lg text-xs cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            {/* Enterprise (Coming Soon) */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Enterprise (Coming Soon)</h4>
                <div className="text-2xl font-extrabold text-slate-900">Custom</div>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1.5 font-medium">
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Custom checklists</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> Dedicated AI models</li>
                  <li className="flex items-center gap-1.5"><span className="text-brand-500">✓</span> API Access</li>
                </ul>
              </div>
              <button disabled className="mt-6 w-full py-2 bg-slate-50 border border-slate-200 text-slate-400 font-semibold rounded-lg text-xs cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
