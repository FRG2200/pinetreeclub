import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Image, Video, Flame, Leaf, Palette, Box, Globe, Clapperboard, Loader2 } from "lucide-react";

interface ModelStat {
  name: string;
  count: number;
  percentage: string;
}

const defaultImageModels: ModelStat[] = [
  { name: "GPT-Image-1", count: 0, percentage: "—" },
  { name: "Nano Banana Pro", count: 0, percentage: "—" },
  { name: "Flux Kontext Pro", count: 0, percentage: "—" },
  { name: "Midjourney V7", count: 0, percentage: "—" },
  { name: "Seedream 4.5", count: 0, percentage: "—" },
];

const defaultVideoModels: ModelStat[] = [
  { name: "Kling 3.0", count: 0, percentage: "—" },
  { name: "Veo 3 Fast", count: 0, percentage: "—" },
  { name: "Seedance 1.5 Pro", count: 0, percentage: "—" },
  { name: "Sora 2", count: 0, percentage: "—" },
  { name: "Runway Aleph", count: 0, percentage: "—" },
  { name: "WAN 2.5", count: 0, percentage: "—" },
];

const chartColors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#a855f7"];

const providerIcons: Record<string, string> = {
  "OpenAI": "flame",
  "Google": "palette",
  "Black Forest Labs": "palette",
  "ByteDance": "leaf",
  "Midjourney": "palette",
  "Kuaishou": "clapperboard",
  "Runway": "clapperboard",
  "Alibaba": "globe",
  "xAI": "flame",
  "Ideogram": "palette",
  "Recraft": "palette",
  "Hailuo": "clapperboard",
  "Vidu": "clapperboard",
};

const modelIcons: Record<string, string> = {
  "GPT-Image-1": "flame",
  "GPT-Image-1.5": "flame",
  "Nano Banana": "palette",
  "Nano Banana Pro": "palette",
  "Nano Banana Pro 4K": "palette",
  "Flux Kontext Pro": "palette",
  "Seedream 4.0": "leaf",
  "Seedream 4.5": "leaf",
  "Midjourney V7": "palette",
  "Midjourney NIJI 7": "palette",
  "Ideogram V3": "palette",
  "Grok Imagine": "flame",
  "Recraft V3": "palette",
  "Qwen Image": "globe",
  "Veo 3 Fast": "clapperboard",
  "Veo 3 Quality": "clapperboard",
  "Veo 3.1 Fast": "clapperboard",
  "Veo 3.1 Quality": "clapperboard",
  "Kling 3.0": "clapperboard",
  "Kling 3.0 1080p": "clapperboard",
  "Kling 2.6": "clapperboard",
  "Runway Aleph": "clapperboard",
  "Sora 2": "flame",
  "Sora 2 Pro": "flame",
  "Seedance 1.0 Pro": "leaf",
  "Seedance 1.5 Pro": "leaf",
  "WAN 2.5": "globe",
  "Hailuo 2.3 Pro": "clapperboard",
  "Vidu Q3 Pro": "clapperboard",
  "Midjourney Video": "palette",
};

function getIconComponent(iconType: string) {
  switch (iconType) {
    case "flame": return <Flame className="w-4 h-4 text-orange-500" />;
    case "leaf": return <Leaf className="w-4 h-4 text-green-500" />;
    case "palette": return <Palette className="w-4 h-4 text-yellow-500" />;
    case "globe": return <Globe className="w-4 h-4 text-blue-500" />;
    case "clapperboard": return <Clapperboard className="w-4 h-4 text-purple-500" />;
    default: return <Box className="w-4 h-4 text-muted-foreground" />;
  }
}

function RankingTable({ models, type, totalCount }: { models: ModelStat[]; type: "image" | "video"; totalCount: number }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Model</th>
              <th className="text-left py-3 px-4">Usage</th>
              <th className="text-right py-3 px-4">Count</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, idx) => (
              <tr key={model.name} className="border-b border-border/50 transition-colors" data-testid={`${type}-model-row-${idx}`}>
                <td className="py-3 px-4">
                  <span className={`font-bold ${idx < 3 ? "text-primary" : "text-muted-foreground"}`} data-testid={`text-rank-${type}-${idx}`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {getIconComponent(modelIcons[model.name] || "box")}
                    <span className="font-medium text-sm" data-testid={`text-model-name-${type}-${idx}`}>{model.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: model.percentage === "—" ? "0%" : model.percentage,
                          backgroundColor: chartColors[idx % chartColors.length]
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground" data-testid={`text-percentage-${type}-${idx}`}>{model.percentage}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm text-muted-foreground">{model.count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default function ModelRankingPage() {
  const { data: stats, isLoading, refetch } = useQuery<{ image: ModelStat[]; video: ModelStat[] }>({
    queryKey: ["/api/model-stats"],
    refetchInterval: 30 * 60 * 1000,
  });

  const imageModels = stats?.image?.length ? stats.image : defaultImageModels;
  const videoModels = stats?.video?.length ? stats.video : defaultVideoModels;

  const totalImageCount = imageModels.reduce((sum, m) => sum + m.count, 0);
  const totalVideoCount = videoModels.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Analytics</p>
          <h1 className="text-3xl font-light tracking-tight" data-testid="text-page-title">Model Ranking</h1>
          <p className="text-sm text-muted-foreground font-light mt-2">Usage statistics based on real generation data</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-lg border border-border/30 bg-card">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Image Generations</p>
          <p className="text-2xl font-light" data-testid="text-total-image">{totalImageCount.toLocaleString()}</p>
        </div>
        <div className="p-5 rounded-lg border border-border/30 bg-card">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Video Generations</p>
          <p className="text-2xl font-light" data-testid="text-total-video">{totalVideoCount.toLocaleString()}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-light flex items-center gap-2" data-testid="text-image-models-header">
              <Image className="w-4 h-4 text-muted-foreground" />
              Image Models
            </h2>
            <RankingTable models={imageModels} type="image" totalCount={totalImageCount} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-light flex items-center gap-2" data-testid="text-video-models-header">
              <Video className="w-4 h-4 text-muted-foreground" />
              Video Models
            </h2>
            <RankingTable models={videoModels} type="video" totalCount={totalVideoCount} />
          </div>
        </div>
      )}

      {totalImageCount === 0 && totalVideoCount === 0 && !isLoading && (
        <div className="text-center py-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground font-light">No generation data yet. Rankings will update as users create content.</p>
        </div>
      )}
    </div>
  );
}
