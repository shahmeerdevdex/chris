import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, UserStatus } from "@/lib/types";
import { PlusCircle, Users } from "lucide-react";
import UserTable from "./UserTable";
import AddUserModal from "./AddUserModal";
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<UserStatus | "all">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: subscriptionsData, error: subscriptionsError } =
        await supabase.from("subscriptions").select("*");

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      const userIds = subscriptionsData
        .map((subscription) => subscription.user_id)
        .filter(Boolean);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        throw profilesError;
      }

      const profilesMap = new Map();
      profilesData?.forEach((profile) => {
        profilesMap.set(profile.id, profile);
      });

      const transformedUsers: User[] = subscriptionsData.map((subscription) => {
        let userStatus: UserStatus = "active";
        if (subscription.status === "inactive") {
          userStatus = "expired";
        } else if (
          subscription.subscription_end_date &&
          new Date(subscription.subscription_end_date) > new Date()
        ) {
          userStatus = "trial";
        } else if (subscription.status === "canceled") {
          userStatus = "cancelled";
        }

        const profile = profilesMap.get(subscription.user_id);

        let displayName = "Unknown User";
        let email = "unknown@example.com";

        if (profile) {
          displayName = profile.display_name || "Unknown User";
          email = profile.email || "unknown@example.com";
        } else {
          displayName =
            subscription.stripe_customer_id || "User " + subscription.id;

          if (subscription.user_id && subscription.user_id.includes("@")) {
            email = subscription.user_id;
            if (displayName === "User " + subscription.id) {
              const emailParts = email.split("@");
              const rawName = emailParts[0].replace(/[^a-zA-Z0-9]/g, " ");
              displayName = rawName
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
            }
          } else {
            email = `user-${subscription.id}@example.com`;
          }
        }

        let subscriptionAmount = 0;
        if (subscription.type && subscription.type.includes("Monthly")) {
          subscriptionAmount = 5;
        } else if (subscription.type && subscription.type.includes("Yearly")) {
          subscriptionAmount = 50;
        }

        return {
          id: subscription.id.toString(),
          name: displayName,
          email: email,
          status: userStatus,
          trialEndsAt: subscription.subscription_end_date
            ? new Date(subscription.subscription_end_date)
            : null,
          subscriptionAmount: subscriptionAmount,
          subscriptionInterval: subscription.type?.includes("Monthly")
            ? "monthly"
            : "yearly",
          createdAt: new Date(subscription.created_at),
          lastActive: new Date(
            subscription.subscription_end_date || subscription.created_at
          ),
        };
      });

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const numericId = parseInt(userId, 10);

      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", numericId);

      if (error) {
        throw error;
      }

      setUsers(users.filter((user) => user.id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    let supabaseStatus = "active";
    if (newStatus === "expired" || newStatus === "cancelled") {
      supabaseStatus = "inactive";
    }

    try {
      let updateData: any = { status: supabaseStatus };

      if (newStatus === "trial") {
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        updateData = {
          ...updateData,
          subscription_start_date: trialStartDate.toISOString(),
          subscription_end_date: trialEndDate.toISOString(),
        };
      }

      const numericId = parseInt(userId, 10);

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", numericId);

      if (error) {
        throw error;
      }

      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                status: newStatus,
                trialEndsAt:
                  newStatus === "trial"
                    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    : user.trialEndsAt,
              }
            : user
        )
      );

      toast.success(`User status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleAddUser = async (newUser: Omit<User, "id">) => {
    try {
      // For manual user creation, we'll only create a subscription record
      // without requiring a link to auth.users

      const { data: createdUser, error } =
        await supabaseAdmin.auth.admin.createUser({
          email: newUser.email,
          password: "password",
          email_confirm: true,
        });

      if (error) {
        throw error;
      }

      if (createdUser.user?.id) {
        const today = new Date().toISOString();
        const subscriptionData = {
          stripe_customer_id: null,
          user_id: createdUser.user?.id,
          status:
            newUser.status === "active"
              ? "active"
              : newUser.status === "cancelled"
              ? "canceled"
              : "inactive",
          subscription_start_date: newUser.status === "trial" ? today : null,
          subscription_end_date: newUser.trialEndsAt?.toISOString() || null,
          type:
            newUser.subscriptionInterval === "monthly"
              ? "Monthly Plan"
              : newUser.subscriptionInterval === "yearly"
              ? "Yearly Plan"
              : "Free Plan",
        };

        const { data, error } = await supabase
          .from("subscriptions")
          .insert(subscriptionData)
          .select("user_id")
          .single();

        if (error) {
          throw error;
        }

        const newUserWithId: User = {
          ...newUser,
          id: data.user_id.toString(),
        };

        setUsers((prevUsers) => [...prevUsers, newUserWithId]);
        setIsAddUserModalOpen(false);
        toast.success("User added successfully");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    }
  };

  const filteredUsers =
    selectedFilter === "all"
      ? users
      : users.filter((user) => user.status === selectedFilter);

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          <h2 className="text-2xl font-semibold tracking-tight">
            User Management
          </h2>
        </div>
        <Button onClick={() => setIsAddUserModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          onClick={() => setSelectedFilter("all")}
          className="text-sm"
        >
          All Users
        </Button>
        <Button
          variant={selectedFilter === "active" ? "default" : "outline"}
          onClick={() => setSelectedFilter("active")}
          className="text-sm"
        >
          Active
        </Button>
        <Button
          variant={selectedFilter === "trial" ? "default" : "outline"}
          onClick={() => setSelectedFilter("trial")}
          className="text-sm"
        >
          Trial
        </Button>
        <Button
          variant={selectedFilter === "expired" ? "default" : "outline"}
          onClick={() => setSelectedFilter("expired")}
          className="text-sm"
        >
          Expired
        </Button>
        <Button
          variant={selectedFilter === "cancelled" ? "default" : "outline"}
          onClick={() => setSelectedFilter("cancelled")}
          className="text-sm"
        >
          Cancelled
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onDelete={handleDeleteUser}
          onStatusChange={handleStatusChange}
        />
      )}

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};

export default UserManagement;
