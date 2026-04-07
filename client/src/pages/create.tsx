import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIModel { id: number; name: string; type: string; provider: string; creditsCost: number; }

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"text2image" | "text2video">("text2image");
  const [model, setModel] = useState("");
  const { data: imageModels = [] } = useQuery<AIModel[]>({ queryKey: ["/api/models/image"] });
  const { data: videoModels = [] } = useQuery<AIModel[]>({ queryKey: ["/api/models/video"] });
  const currentModels = type === "text2image" ? imageModels : videoModels;
  useEffect(() => {
    if (currentModels.length > 0 && !currentModels.find(m => m.name === model)) {
      setModel(currentModels[0].name);
    }
  }, [currentModels, type]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string; model: string; aspectRatio: string; creditsCost: number }) => {
      return apiRequest("POST", "/api/generations", {
        prompt: data.prompt,
        type: data.type,
        model: data.model,
        aspectRatio: data.aspectRatio,
        creditsCost: data.creditsCost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({
        title: "生成開始",
        description: "生成タスクがキューに追加されました。",
      });
      navigate("/library");
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "生成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!user) {
      toast({ title: "エラー", description: "ログインしてください。", variant: "destructive" });
      return;
    }

    const selectedModelObj = currentModels.find(m => m.name === model);
    createMutation.mutate({ prompt, type, model, aspectRatio, creditsCost: selectedModelObj?.creditsCost || 2 });
  };

  const isPending = createMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          新しい作品を<span className="text-primary">作成</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AIモデルで想像を現実に変えましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />
          <CardHeader>
            <CardTitle>生成設定</CardTitle>
            <CardDescription>
              AI生成のパラメータを設定してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType("text2image")}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200",
                  type === "text2image"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                )}
                data-testid="type-image"
              >
                <ImageIcon className="h-8 w-8 mb-3" />
                <span className="font-semibold">テキスト→画像</span>
              </button>
              <button
                type="button"
                onClick={() => setType("text2video")}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200",
                  type === "text2video"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                )}
                data-testid="type-video"
              >
                <Video className="h-8 w-8 mb-3" />
                <span className="font-semibold">テキスト→動画</span>
              </button>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="作りたいイメージを詳しく書いてください..."
                className="min-h-[160px] p-4 text-base resize-none rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                data-testid="prompt-input"
              />
              <div className="flex gap-2 flex-wrap">
                {["サイバーパンク", "アニメ", "リアル", "油絵風"].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setPrompt((p) => p + (p ? "、" : "") + style)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
                  >
                    + {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
              <div className="space-y-2">
                <span className="text-sm font-medium">アスペクト比</span>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="w-full" data-testid="aspect-ratio-select">
                    <SelectValue placeholder="比率を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">正方形 (1:1)</SelectItem>
                    <SelectItem value="16:9">横長 (16:9)</SelectItem>
                    <SelectItem value="9:16">縦長 (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">モデル</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full" data-testid="model-select">
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentModels.map(m => (
                      <SelectItem key={m.name} value={m.name}>{m.name} ({m.creditsCost}cr)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={!prompt || isPending}
                className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                data-testid="generate-button"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {type === "text2image" ? "画像を生成" : "動画を生成"} ({type === "text2image" ? 2 : 20} クレジット)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
