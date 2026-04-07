import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Sparkles, Wand2, Video, Camera, Flame, Wrench } from "lucide-react";
import type { App } from "@shared/schema";

const categories = ["All", "Tools", "Creative", "Video FX", "Photography", "Trending"];

const categoryIcons: Record<string, typeof Wrench> = {
  "All": Sparkles,
  "Tools": Wrench,
  "Creative": Wand2,
  "Video FX": Video,
  "Photography": Camera,
  "Trending": Flame,
};

export default function AppsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [, navigate] = useLocation();

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  const filteredApps = activeCategory === "All"
    ? apps
    : apps.filter((app) => app.category === activeCategory);

  const handleAppClick = (app: App) => {
    const params = new URLSearchParams();
    if (app.presetPrompt) params.set("prompt", app.presetPrompt);
    if (app.presetModel) params.set("model", app.presetModel);
    if (app.presetParams) params.set("params", app.presetParams);
    params.set("app", app.slug);
    navigate(`${app.targetRoute}?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Presets</p>
        <h1 className="text-3xl font-light tracking-tight" data-testid="text-page-title">Creative Workflows</h1>
        <p className="text-sm text-muted-foreground font-light mt-2 max-w-xl">
          One-tap AI presets. Each workflow is pre-configured to deliver professional results — select one and start creating instantly.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap border-b border-border/30 pb-4">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || Sparkles;
          return (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="text-xs"
              data-testid={`category-${cat}`}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {cat}
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground font-light">No workflows in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app, idx) => (
            <Card
              key={app.id}
              className="bg-card border-border/40 overflow-hidden cursor-pointer group transition-all duration-200 hover-elevate"
              onClick={() => handleAppClick(app)}
              data-testid={`app-card-${app.slug}`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{app.category}</p>
                    <h3 className="text-sm font-medium" data-testid={`app-name-${app.slug}`}>{app.name}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">{app.description}</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {app.creditCost} credits
                  </span>
                  {(app.usageCount ?? 0) > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {(app.usageCount ?? 0).toLocaleString()} uses
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
