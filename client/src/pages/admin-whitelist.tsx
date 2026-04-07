import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Shield, UserPlus, Loader2 } from "lucide-react";
import type { AllowedUser } from "@shared/schema";

export default function AdminWhitelistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);

  const { data: whitelistStatus } = useQuery<{ allowed: boolean; isAdmin: boolean }>({
    queryKey: ["/api/whitelist/check"],
  });

  const { data: users, isLoading } = useQuery<AllowedUser[]>({
    queryKey: ["/api/whitelist"],
    enabled: whitelistStatus?.isAdmin === true,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/whitelist", { email: newEmail, isAdmin: makeAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      setNewEmail("");
      setMakeAdmin(false);
      toast({ title: "User added to whitelist" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add user", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/whitelist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whitelist"] });
      toast({ title: "User removed from whitelist" });
    },
  });

  if (!whitelistStatus?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground font-light">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl font-light tracking-tight" data-testid="whitelist-title">Access Whitelist</h1>
        <p className="text-sm text-muted-foreground font-light mt-2">Manage who can access Pine tree club</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <Input
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
            data-testid="input-whitelist-email"
          />
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!newEmail || addMutation.isPending}
            data-testid="button-add-user"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground font-light cursor-pointer">
          <input
            type="checkbox"
            checked={makeAdmin}
            onChange={(e) => setMakeAdmin(e.target.checked)}
            className="rounded border-border"
            data-testid="checkbox-admin"
          />
          Grant admin privileges
        </label>
      </div>

      <div className="border-t border-border/30 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {users?.length || 0} approved users
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {users?.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 px-4 rounded-md transition-colors group hover-elevate"
                data-testid={`whitelist-user-${u.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-light">{u.email}</span>
                  {u.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary/70">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(u.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-${u.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
