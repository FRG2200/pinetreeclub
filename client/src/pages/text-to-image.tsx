import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ChevronDown, Heart, Edit, RefreshCw, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Generation } from "@shared/schema";

const aspectRatios = ["1:1", "4:3", "3:4", "16:9", "9:16"];
const resolutions = ["2K", "4K", "HD"];

interface AIModel {
  id: number;
  name: string;
  type: string;
  provider: string;
  creditsCost: number;
}

export default function TextToImagePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const presetPrompt = urlParams.get("prompt") || "";
  const presetModel = urlParams.get("model") || "";
  const presetParamsStr = urlParams.get("params") || "";
  const presetExtra = presetParamsStr ? (() => { try { return JSON.parse(presetParamsStr); } catch { return {}; } })() : {};

  const { data: imageModels = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/models/image"],
  });

  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    if (imageModels.length > 0 && !selectedModel) {
      if (presetModel) {
        const match = imageModels.find(m => m.name.toLowerCase().includes(presetModel.toLowerCase()));
        if (match) { setSelectedModel(match.name); return; }
      }
      setSelectedModel(imageModels[0].name);
    }
  }, [imageModels]);
  const [aspectRatio, setAspectRatio] = useState(presetExtra.aspect_ratio || "1:1");
  const [resolution, setResolution] = useState(presetExtra.resolution || "2K");
  const [numOutputs, setNumOutputs] = useState(2);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { prompt: presetPrompt }
  });

  useEffect(() => {
    if (presetPrompt) setValue("prompt", presetPrompt);
  }, []);

  const prompt = watch("prompt");

  const { data: generations = [] } = useQuery<Generation[]>({
    queryKey: ["/api/generations"],
    refetchInterval: (query) => {
      const data = query.state.data as Generation[] | undefined;
      const hasProcessing = data?.some(g => g.status === "processing" || g.status === "pending");
      return hasProcessing ? 3000 : false;
    },
  });

  const imageGenerations = generations.filter(g => g.type === "text2image" || g.type === "image2image");

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string }) => {
      return apiRequest("POST", "/api/generations", {
        ...data,
        type: "text2image",
        model: selectedModel,
        aspectRatio,
        resolution,
        numOutputs,
        creditsCost: numOutputs * 2,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: "画像を生成しています..." });
    },
    onError: (err: any) => {
      toast({ 
        title: "エラー", 
        description: err.message || "生成に失敗しました",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: { prompt: string }) => {
    if (!data.prompt.trim()) {
      toast({ title: "プロンプトを入力してください", variant: "destructive" });
      return;
    }
    generateMutation.mutate(data);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Controls */}
      <div className="w-96 border-r border-border p-6 space-y-6 overflow-y-auto">
        <h1 className="text-xl font-bold">テキストから画像生成</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              {...register("prompt")}
              placeholder="閑静しているイメージを書いてみてください"
              className="min-h-32 resize-none bg-card"
              data-testid="prompt-input"
            />
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" className="text-xs text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                最適化
              </Button>
            </div>
          </div>

          {/* Demo Accordion */}
          <div className="border border-border rounded-lg">
            <button type="button" className="w-full flex items-center justify-between p-3 text-sm">
              <span>デモ</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="single" className="flex-1">単一モデル</TabsTrigger>
                <TabsTrigger value="compare" className="flex-1">モデル比較</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">モデル</span>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48" data-testid="model-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map(m => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name} ({m.creditsCost}cr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                モデル一覧を見る
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">アスペクト比</span>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-48" data-testid="aspect-ratio-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">解像度</span>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-48" data-testid="resolution-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-sm">画像サイズ</span>
              <div className="flex items-center gap-2 text-sm">
                <span>W</span>
                <input type="text" value="1024" readOnly className="w-16 bg-muted px-2 py-1 rounded text-center" />
                <span className="text-muted-foreground">↔</span>
                <span>H</span>
                <input type="text" value="1024" readOnly className="w-16 bg-muted px-2 py-1 rounded text-center" />
                <span className="text-muted-foreground">PX</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm">生成される枚数</span>
              <div className="flex gap-2">
                {[1, 2, 4, 6, 8, 10].map(n => (
                  <Button
                    key={n}
                    type="button"
                    variant={numOutputs === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNumOutputs(n)}
                    data-testid={`num-outputs-${n}`}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            disabled={generateMutation.isPending || !selectedModel}
            data-testid="generate-button"
          >
            {generateMutation.isPending ? "生成中..." : `作成 ⬦ ${numOutputs * 2}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">想定生成時間: 20s 〜 62s</p>
        </form>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全て</TabsTrigger>
              <TabsTrigger value="images">画像</TabsTrigger>
              <TabsTrigger value="videos">動画</TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            お気に入り
          </label>
        </div>

        {imageGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 opacity-50" />
            <p>まだ生成された画像がありません</p>
            <p className="text-sm">プロンプトを入力して生成を開始してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imageGenerations.map((gen, idx) => (
              <Card key={gen.id} className="bg-card border-border" data-testid={`generation-card-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 mb-3">
                    <Badge variant="secondary">{gen.type === "text2image" ? "テキストから画像" : "画像編集"}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(gen.createdAt!).toLocaleString("ja-JP")}</span>
                  </div>
                  <div className="flex items-start gap-4 mb-3 text-sm text-muted-foreground">
                    <span>モデル: {gen.model}</span>
                    <span>アスペクト比: {gen.aspectRatio}</span>
                    <span>解像度: {gen.resolution}</span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-2">{gen.prompt}</p>
                  
                  {gen.status === "completed" && gen.imageUrl ? (
                    <div className="rounded-lg overflow-hidden">
                      <img src={gen.imageUrl} alt={gen.prompt} className="w-full max-h-96 object-contain" />
                    </div>
                  ) : gen.status === "processing" ? (
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                  ) : gen.status === "failed" ? (
                    <div className="h-48 bg-destructive/10 rounded-lg flex items-center justify-center text-destructive">
                      生成に失敗しました
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      編集
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      再生成
                    </Button>
                    <Button variant="ghost" size="icon" className="ml-auto">
                      <Heart className={`w-4 h-4 ${gen.isFavorite ? "fill-primary text-primary" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
