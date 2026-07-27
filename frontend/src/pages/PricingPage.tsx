import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { FeatureComparisonTable } from '@/components/subscription';
import { API_ROUTES } from '@/config/api-routes';

interface CurrentSubscription {
  plan: string;
  status: string;
  expiry_date: string | null;
  remaining_analyses: number | null;
  demo_mode?: boolean;
}

export const PricingPage: React.FC = () => {
  // Fetch current subscription
  const { data: currentSub, isLoading: isSubLoading } = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.SUBSCRIPTION.CURRENT);
      return res.data;
    },
  });

  if (isSubLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  const plans = [
    {
      name: "Free Plan",
      price: "₹0",
      features: [
        "10 AI analyses per month",
        "Maximum upload size: 5 MB",
        "Basic OCR",
        "AI Summary",
        "Last 10 analyses"
      ],
      isCurrent: true,
      buttonText: "Your Current Plan",
      disabled: true
    },
    {
      name: "Pro (Coming Soon)",
      price: "₹299",
      features: [
        "Unlimited analyses",
        "Unlimited history",
        "Large file uploads (25 MB)",
        "Advanced OCR",
        "PDF Export (future ready)",
        "Priority processing"
      ],
      isCurrent: false,
      buttonText: "Coming Soon",
      disabled: true
    },
    {
      name: "Enterprise (Coming Soon)",
      price: "Custom",
      features: [
        "Custom checklists",
        "Dedicated AI models",
        "API Access",
        "24/7 SLA Support",
        "SSO/SAML Ingestions"
      ],
      isCurrent: false,
      buttonText: "Coming Soon",
      disabled: true
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 relative fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display sm:text-4xl">
          Guardian Billing Plans
        </h2>
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold max-w-xl mx-auto leading-relaxed shadow-sm">
          This MVP provides unrestricted access to all features. Paid plans will be introduced in a future release.
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 bg-white shadow-soft ${
              plan.isCurrent && !currentSub?.demo_mode
                ? 'border-brand-500 ring-4 ring-brand-50'
                : 'border-slate-200/60'
            }`}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-display text-slate-900 uppercase tracking-wide">
                {plan.name}
              </h3>
              <div className="py-4 border-y border-slate-100 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-slate-400 text-xs font-semibold">/ month</span>}
              </div>
              <ul className="space-y-3 pt-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                    <span className="text-brand-500 font-bold mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 pt-4">
              <button
                disabled={plan.disabled}
                className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-400 font-bold rounded-lg text-sm cursor-not-allowed"
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="max-w-4xl mx-auto pt-4">
        <FeatureComparisonTable />
      </div>
    </div>
  );
};
