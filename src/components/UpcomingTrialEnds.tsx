import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpcomingTrialEndsProps {
  className?: string;
}

const UpcomingTrialEnds = ({ className }: UpcomingTrialEndsProps) => {
  const [trialUsers, setTrialUsers] = useState<User[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingTrialEnds();

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const fetchUpcomingTrialEnds = async () => {
    setIsLoading(true);
    try {
      // Get current date
      const today = new Date();

      // Get date 14 days from now
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 14);

      // Query Supabase for trial subscriptions ending in the next 14 days
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .gte("subscription_end_date", today.toISOString())
        .lte("subscription_end_date", futureDate.toISOString())
        .order("subscription_end_date");

      if (error) {
        throw error;
      }

      // Transform to User type
      const transformedUsers: User[] = data.map((subscription) => ({
        id: subscription.id.toString(),
        name: subscription.stripe_customer_id || "Unknown",
        email: subscription.user_id || "unknown@example.com",
        status: "trial",
        trialEndsAt: subscription.subscription_end_date
          ? new Date(subscription.subscription_end_date)
          : null,
        subscriptionAmount: 0,
        subscriptionInterval: null,
        createdAt: new Date(subscription.created_at),
        lastActive: new Date(subscription.created_at),
      }));

      setTrialUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching upcoming trial ends:", error);
      toast.error("Failed to load trial users");
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (date: Date | null) => {
    if (!date) return 0;
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSendReminders = () => {
    toast.success("Reminder emails have been sent");
    // In a real app, you would implement the email sending logic here
  };

  return (
    <Card
      className={`border shadow-sm animate-scale-in ${className}`}
      style={{ animationDelay: "200ms" }}
    >
      <CardHeader>
        <CardTitle>Upcoming Trial Expirations</CardTitle>
        <CardDescription>
          Users with trials ending in the next 14 days
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : trialUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No upcoming trial expirations
          </p>
        ) : (
          trialUsers.map((user) => {
            const daysRemaining = getDaysRemaining(user.trialEndsAt);
            let badgeColor = "bg-green-100 text-green-800";

            if (daysRemaining <= 3) {
              badgeColor = "bg-red-100 text-red-800";
            } else if (daysRemaining <= 7) {
              badgeColor = "bg-amber-100 text-amber-800";
            }

            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
                  >
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSendReminders}
          disabled={trialUsers.length === 0}
        >
          Send Reminder Emails
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UpcomingTrialEnds;
