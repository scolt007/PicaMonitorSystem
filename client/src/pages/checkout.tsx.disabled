import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useLocation } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ organizationId }: { organizationId: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded, confirm with backend
        await apiRequest("POST", `/api/confirm-payment/${organizationId}`, {
          paymentIntentId: paymentIntent.id
        });
        
        toast({
          title: "Payment Successful",
          description: "Your organization has been registered!",
        });
        
        // Redirect to login page
        navigate('/auth');
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "There was an error processing your payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          "Pay $10.00"
        )}
      </Button>
    </form>
  );
};

interface CheckoutPageProps {
  params?: any;
}

export default function CheckoutPage(props: CheckoutPageProps) {
  // Get parameters from URL query string
  const searchParams = new URLSearchParams(window.location.search);
  const organizationId = searchParams.get('orgId') ? Number(searchParams.get('orgId')) : undefined;
  const orgName = searchParams.get('orgName') || undefined;
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState(10);
  const [promoCode, setPromoCode] = useState("");
  const [freeRegistration, setFreeRegistration] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!organizationId) {
      navigate('/auth');
      return;
    }
    
    // Create PaymentIntent as soon as the page loads
    setIsLoading(true);
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: 10, // $10 for registration
      promoCode
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.freeRegistration) {
          setFreeRegistration(true);
          setAmount(0);
        } else {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
        }
        setIsLoading(false);
      })
      .catch(error => {
        toast({
          title: "Failed to initialize payment",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
      });
  }, [organizationId, promoCode, navigate, toast]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter Promo Code",
        description: "Please enter a promo code first",
        variant: "default"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/validate-promo-code", { promoCode });
      const result = await response.json();
      
      if (result.valid) {
        toast({
          title: "Promo Code Applied",
          description: result.message,
        });
        // Refresh payment intent with the promo code
        apiRequest("POST", "/api/create-payment-intent", { 
          amount: 10,
          promoCode
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.freeRegistration) {
              setFreeRegistration(true);
              setAmount(0);
            } else {
              setClientSecret(data.clientSecret);
              setAmount(data.amount);
            }
          });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate promo code",
        variant: "destructive"
      });
    }
  };

  const completeRegistration = async () => {
    try {
      await apiRequest("POST", `/api/confirm-payment/${organizationId}`, { promoCode });
      
      toast({
        title: "Registration Complete",
        description: "Your organization has been registered successfully!",
      });
      
      // Redirect to login page
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Failed to complete registration",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Initializing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Registration</CardTitle>
          <CardDescription>
            {orgName ? `Register ${orgName}` : 'One-time registration fee'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Promo code section */}
            <div className="space-y-2">
              <Label htmlFor="promo-code">Have a promo code?</Label>
              <div className="flex space-x-2">
                <Input 
                  id="promo-code" 
                  placeholder="Enter promo code" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={applyPromoCode}>
                  Apply
                </Button>
              </div>
            </div>

            <Separator />
            
            <div className="text-xl font-semibold text-center">
              Total: ${amount.toFixed(2)}
            </div>

            {freeRegistration ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-100 text-green-800 rounded-md">
                  Your promo code has been applied successfully. Registration is free!
                </div>
                <Button className="w-full" onClick={completeRegistration}>
                  Complete Registration
                </Button>
              </div>
            ) : clientSecret ? (
              // Make SURE to wrap the form in <Elements> which provides the stripe context.
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm organizationId={organizationId!} />
              </Elements>
            ) : (
              <div className="p-3 bg-red-100 text-red-800 rounded-md">
                Failed to initialize payment. Please try again later.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Secure payment powered by Stripe
        </CardFooter>
      </Card>
    </div>
  );
}