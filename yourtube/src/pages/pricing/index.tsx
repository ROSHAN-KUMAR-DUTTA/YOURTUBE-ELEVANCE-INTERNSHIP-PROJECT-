import React, { useEffect, useState } from "react";
import { Check, Crown, Zap, Shield, Star, Clock } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    price: "0",
    watchLimit: "5 mins/day",
    features: ["Standard quality", "Watch up to 5 minutes daily", "Ad-supported", "Basic support"],
    icon: <Shield className="w-6 h-6 text-muted-foreground" />,
    color: "bg-muted",
    buttonVariant: "outline",
  },
  {
    name: "Bronze",
    price: "10",
    watchLimit: "7 mins/day",
    features: ["HD quality", "Watch up to 7 minutes daily", "No ads", "Priority support"],
    icon: <Star className="w-6 h-6 text-amber-600" />,
    color: "bg-amber-500/10 border-amber-200",
    buttonVariant: "outline",
  },
  {
    name: "Silver",
    price: "50",
    watchLimit: "10 mins/day",
    features: ["Full HD quality", "Watch up to 10 minutes daily", "No ads", "Premium support", "Download videos"],
    icon: <Zap className="w-6 h-6 text-slate-400" />,
    color: "bg-slate-500/10 border-slate-200",
    buttonVariant: "outline",
  },
  {
    name: "Gold",
    price: "100",
    watchLimit: "Unlimited",
    features: ["4K Ultra HD", "Unlimited watch time", "No ads", "24/7 VIP Support", "Download videos", "Early access"],
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    color: "bg-yellow-500/10 border-yellow-400 shadow-yellow-100 shadow-xl",
    buttonVariant: "default",
    popular: true,
  },
];

const planTiers: Record<string, number> = {
  "Free": 0,
  "Bronze": 1,
  "Silver": 2,
  "Gold": 3
};

const PricingPage = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (planName: string) => {
    if (!user) {
      alert("Please login first to upgrade.");
      return;
    }
    setLoading(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setLoading(false);
      return;
    }

    try {
      const order = await axiosInstance.post("/subscription/payment/create", { planName });
      
      if (order.data.id && order.data.id.startsWith("order_mock_")) {
          const verifyRes = await axiosInstance.post("/subscription/payment/verify", {
              razorpay_order_id: order.data.id,
              razorpay_payment_id: "pay_mock_" + Date.now(),
              razorpay_signature: "mock_signature",
              userId: user._id,
              planName
          });
          if (verifyRes.data.isPremium) {
              if (verifyRes.data.user) {
                  localStorage.setItem("user", JSON.stringify(verifyRes.data.user));
              }
              alert(`Successfully upgraded to ${planName} (Mock Mode)! Check your email for the invoice.`);
              window.location.reload();
          }
          return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy",
        amount: order.data.amount,
        currency: order.data.currency,
        name: `YourTube ${planName}`,
        description: `Upgrade to ${planName} Plan`,
        order_id: order.data.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post("/subscription/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              planName
            });
            
            if (verifyRes.data.isPremium) {
              if (verifyRes.data.user) {
                localStorage.setItem("user", JSON.stringify(verifyRes.data.user));
              }
              alert(`Successfully upgraded to ${planName}! Check your email for the invoice.`);
              window.location.href = "/";
            }
          } catch (err) {
            alert("Payment Verification Failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: planName === "Gold" ? "#eab308" : "#000000",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.log(err);
      alert("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-5xl sm:tracking-tight lg:text-6xl">
          Choose your perfect plan
        </h2>
        <p className="mt-4 max-w-xl mx-auto text-xl text-muted-foreground">
          Unlock unlimited viewing, premium quality, and exclusive features with our subscription tiers.
        </p>
      </div>

      <div className="mt-16 max-w-7xl mx-auto grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-6 sm:p-8 rounded-2xl border ${plan.color} ${
              plan.popular ? "lg:scale-105 z-10 border-yellow-400 shadow-xl" : "bg-card text-card-foreground border-border"
            } transition-transform duration-300 hover:scale-[1.02] lg:hover:scale-105`}
          >
            {plan.popular && (
              <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                <span className="bg-yellow-500/100 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-foreground">{plan.name}</h3>
              {plan.icon}
            </div>

            <div className="mt-4 mb-8 flex items-baseline text-5xl font-extrabold">
              ₹{plan.price}
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>

            <div className="flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground bg-card text-card-foreground/50 py-2 px-3 rounded-lg border border-border">
              <Clock className="w-4 h-4" />
              Watch Limit: {plan.watchLimit}
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              disabled={loading || plan.name === "Free" || (planTiers[plan.name] <= planTiers[user?.currentPlan || "Free"])}
              onClick={() => handleCheckout(plan.name)}
              className={`w-full font-medium ${
                plan.popular 
                  ? 'bg-yellow-500/100 hover:bg-yellow-600 text-white border-transparent' 
                  : 'bg-card text-card-foreground text-foreground border border-gray-300 hover:bg-background'
              }`}
              size="lg"
            >
              {user?.currentPlan === plan.name 
                ? "Current Plan" 
                : planTiers[plan.name] < planTiers[user?.currentPlan || "Free"] 
                  ? "Included in your plan"
                  : plan.name === "Free" 
                    ? "Included" 
                    : `Upgrade to ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
