import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, Sparkles, Check, Zap, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripeProduct {
  product_id: string;
  product_name: string;
  product_description: string;
  product_metadata: {
    credits?: string;
    base_credits?: string;
    bonus_credits?: string;
    bonus_percent?: string;
    badge?: string;
    perks?: string;
    type?: string;
  } | null;
  price_id: string;
  unit_amount: number;
  currency: string;
}

export default function PricingPage() {
  const { toast } = useToast();

  const { data: stripeProducts = [], isLoading } = useQuery<StripeProduct[]>({
    queryKey: ["/api/stripe/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, packageCredits }: { priceId: string; packageCredits: number }) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId, packageCredits });
      return await res.json() as { url: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "エラー", description: "チェックアウトの開始に失敗しました。ログインしてからお試しください。", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatPrice = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getPerks = (metadata: StripeProduct["product_metadata"]): string[] => {
    if (!metadata?.perks) return [];
    try {
      return JSON.parse(metadata.perks);
    } catch {
      return [];
    }
  };

  const isHighlighted = (pkg: StripeProduct) => {
    const badge = pkg.product_metadata?.badge || "";
    return badge === "おすすめ" || badge === "人気" || badge === "ベストバリュー";
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "おすすめ": return <Sparkles className="w-3 h-3" />;
      case "人気": return <Star className="w-3 h-3" />;
      case "ベストバリュー": return <Crown className="w-3 h-3" />;
      case "最上位": return <Crown className="w-3 h-3" />;
      case "お得": return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="overflow-y-auto h-full bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-16 py-16 space-y-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80 mb-3" data-testid="text-pricing-label">クレジット購入</p>
          <h1 className="text-3xl font-light tracking-tight mb-4" data-testid="text-page-title">あなたの創作に、最適なプランを</h1>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            追加クレジットは無期限。購入後すぐにご利用いただけます。高額パックほどボーナスクレジットがお得です。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stripeProducts.map((pkg, idx) => {
            const totalCredits = parseInt(pkg.product_metadata?.credits || "0");
            const baseCredits = parseInt(pkg.product_metadata?.base_credits || "0");
            const bonusCredits = parseInt(pkg.product_metadata?.bonus_credits || "0");
            const bonusPercent = parseInt(pkg.product_metadata?.bonus_percent || "0");
            const badge = pkg.product_metadata?.badge || "";
            const perks = getPerks(pkg.product_metadata);
            const unitPrice = totalCredits > 0 ? (pkg.unit_amount / totalCredits).toFixed(1) : "0";
            const highlighted = isHighlighted(pkg);

            return (
              <div
                key={pkg.price_id}
                className={`relative rounded-lg border transition-all duration-200 flex flex-col ${
                  highlighted
                    ? "border-primary/50 bg-primary/[0.03]"
                    : "border-border/40 bg-card"
                }`}
                data-testid={`pricing-card-${idx}`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      variant={highlighted ? "default" : "secondary"}
                      className="text-[10px] uppercase tracking-wider px-3 py-0.5 flex items-center gap-1 no-default-active-elevate"
                      data-testid={`badge-${idx}`}
                    >
                      {getBadgeIcon(badge)}
                      {badge}
                    </Badge>
                  </div>
                )}

                <div className="p-5 pt-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-1" data-testid={`package-name-${idx}`}>{pkg.product_name}</h3>
                    <p className="text-[11px] text-muted-foreground font-light">{pkg.product_description}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-light" data-testid={`package-price-${idx}`}>{formatPrice(pkg.unit_amount)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">¥{unitPrice} / クレジット</p>
                  </div>

                  <div className="mb-4 p-3 rounded-md bg-muted/20 border border-border/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">クレジット</span>
                      <span className="text-sm font-medium" data-testid={`package-credits-${idx}`}>{totalCredits.toLocaleString()}</span>
                    </div>
                    {bonusCredits > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">ボーナス</span>
                        <span className="text-xs text-primary font-medium" data-testid={`package-bonus-${idx}`}>+{bonusCredits.toLocaleString()} (+{bonusPercent}%)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 mb-4">
                    <ul className="space-y-1.5">
                      {perks.map((perk, perkIdx) => (
                        <li key={perkIdx} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <Check className="w-3 h-3 text-primary/60 mt-0.5 flex-shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    variant={highlighted ? "default" : "outline"}
                    size="sm"
                    onClick={() => checkoutMutation.mutate({ priceId: pkg.price_id, packageCredits: totalCredits })}
                    disabled={checkoutMutation.isPending}
                    data-testid={`buy-package-${idx}`}
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>購入する <ArrowRight className="w-3.5 h-3.5 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {stripeProducts.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm font-light">クレジットパッケージを読み込み中...</p>
          </div>
        )}

        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">クレジット消費目安</p>
            <h2 className="text-xl font-light tracking-tight">何が作れる？</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 rounded-md overflow-hidden border border-border/30">
            <div className="bg-background p-6">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">画像生成</p>
              <p className="text-2xl font-light mb-1">2〜7</p>
              <p className="text-xs text-muted-foreground">クレジット / 1枚</p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 space-y-0.5">
                <span className="block">GPT-Image: 2 / Flux Kontext: 5</span>
                <span className="block">4K画像: 7</span>
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">動画生成</p>
              <p className="text-2xl font-light mb-1">12〜110</p>
              <p className="text-xs text-muted-foreground">クレジット / 1本</p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 space-y-0.5">
                <span className="block">Kling 3.0: 17 / Veo 3 Fast: 22</span>
                <span className="block">Sora 2: 30 / Veo 3 Quality: 110</span>
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">画像編集</p>
              <p className="text-2xl font-light mb-1">2〜5</p>
              <p className="text-xs text-muted-foreground">クレジット / 1回</p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 space-y-0.5">
                <span className="block">基本編集: 2 / 高度な編集: 5</span>
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-muted-foreground font-light space-y-1 pt-4">
          <p>クレジットは購入後すぐに反映されます。</p>
          <p>お問い合わせは <span className="text-primary/80">support@pinetreeclub.com</span> まで。</p>
        </footer>
      </div>
    </div>
  );
}
