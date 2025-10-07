"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { addProductNotificationRequest, hasNotificationRequest } from "@/lib/api/notify"; // Updated import

type NotifyButtonProps = {
  productId: string;
  productName: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export function NotifyButton({ 
  productId, 
  productName,
  className,
  size = "default",
  variant = "default"
}: NotifyButtonProps) {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  // Check if user has already requested notification
  useEffect(() => {
    async function checkExistingRequest() {
      if (isAuthenticated && user && user.email) {
        const { hasRequest } = await hasNotificationRequest(productId, user.email);
        if (hasRequest) {
          setIsNotified(true);
        }
      }
    }

    checkExistingRequest();
  }, [isAuthenticated, user, productId]);

  const handleNotifyClick = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isNotified) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user email and name
      const userEmail = user.email;
      const userName = user.user_metadata?.name || userEmail?.split('@')[0] || 'Anonymous';

      if (!userEmail) {
        toast({
          title: "Email Required",
          description: "You need to have an email address to subscribe for notifications.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Insert notification request into the database
      const { data, error } = await addProductNotificationRequest(productId, userEmail, userName);

      if (error) {
        // Check if it's a duplicate request
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Subscribed",
            description: `You're already subscribed to notifications for ${productName}.`,
            variant: "default"
          });
          setIsNotified(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to subscribe for notifications. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Subscribed!",
          description: `You'll be notified when ${productName} becomes available.`,
          variant: "default"
        });
        setIsNotified(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleNotifyClick}
        className={className}
        size={size}
        variant={variant}
        disabled={isSubmitting || isNotified}
      >
        {isSubmitting ? "Processing..." : isNotified ? "Subscribed" : "Notify Me"}
      </Button>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        title="Sign in for Notifications"
        description={`Please sign in to get notified when ${productName} becomes available.`}
      />
    </>
  );
}