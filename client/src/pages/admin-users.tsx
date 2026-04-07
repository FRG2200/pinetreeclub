import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, ShieldOff, Trash2, Loader2, CreditCard, Users, Search } from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  authProvider: string | null;
  isAdmin: boolean | null;
  createdAt: string | null;
  totalCredits: number;
  generationCount: number;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [creditAmount, setCreditAmount] = useState<Record<string, string>>({});

  const { data: whitelistStatus } = useQuery<{ allowed: boolean; isAdmin: boolean }>({
    queryKey: ["/api/whitelist/check"],
  });

  const { data: allUsers = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: whitelistStatus?.isAdmin === true,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "権限を更新しました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "権限の更新に失敗しました", variant: "destructive" });
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/credits`, { amount });
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreditAmount((prev) => ({ ...prev, [userId]: "" }));
      toast({ title: "クレジットを追加しました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "クレジットの追加に失敗しました", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを削除しました" });
    },
    onError: (err: any) => {
      toast({ title: "エラー", description: err.message || "削除に失敗しました", variant: "destructive" });
    },
  });

  if (!whitelistStatus?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-muted-foreground">管理者のみアクセス可能です</p>
      </div>
    );
  }

  const filtered = allUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto pt-8 px-8 pb-16">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl font-light tracking-tight" data-testid="admin-users-title">ユーザー管理</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {allUsers.length} 名のユーザー
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メールアドレスまたは名前で検索..."
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="bg-card border border-border rounded-lg p-4"
                data-testid={`user-card-${u.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate" data-testid={`user-name-${u.id}`}>
                        {u.lastName || ""} {u.firstName || ""}
                      </span>
                      {u.isAdmin && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary" data-testid={`badge-admin-${u.id}`}>
                          Admin
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {u.authProvider || "local"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`user-email-${u.id}`}>
                      {u.email}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span data-testid={`user-credits-${u.id}`}>
                        <CreditCard className="w-3 h-3 inline mr-1" />
                        {u.totalCredits} credits
                      </span>
                      <span data-testid={`user-gens-${u.id}`}>
                        {u.generationCount} generations
                      </span>
                      {u.createdAt && (
                        <span>
                          登録: {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="追加"
                        value={creditAmount[u.id] || ""}
                        onChange={(e) => setCreditAmount((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-20 h-8 text-xs"
                        data-testid={`input-credits-${u.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        disabled={!creditAmount[u.id] || addCreditsMutation.isPending}
                        onClick={() =>
                          addCreditsMutation.mutate({
                            userId: u.id,
                            amount: parseInt(creditAmount[u.id] || "0"),
                          })
                        }
                        data-testid={`button-add-credits-${u.id}`}
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        付与
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => toggleAdminMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })}
                      disabled={u.id === user?.id}
                      data-testid={`button-toggle-admin-${u.id}`}
                    >
                      {u.isAdmin ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`${u.email} を削除しますか？この操作は元に戻せません。`)) {
                          deleteUserMutation.mutate(u.id);
                        }
                      }}
                      disabled={u.id === user?.id}
                      data-testid={`button-delete-user-${u.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
