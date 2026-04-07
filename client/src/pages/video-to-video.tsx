import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload, FolderOpen, Heart, Edit, RefreshCw, MoreHorizontal, Play, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Generation } from "@shared/schema";

const aspectRatios = ["16:9", "9:16", "1:1", "4:3"];
const resolutions = ["720P", "1080P"];
const durations = ["5s", "10s"];

interface AIModel { id: number; name: string; type: string; provider: string; creditsCost: number; }

export default function VideoToVideoPage() {
  const { data: videoModels = [] } = useQuery<AIModel[]>({ queryKey: ["/api/models/video"] });
  const [selectedModel, setSelectedModel] = useState("");
  useEffect(() => {
    if (videoModels.length > 0 && !selectedModel) setSelectedModel(videoModels[0].name);
  }, [videoModels]);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720P");
  const [duration, setDuration] = useState("5s");
  const [numOutputs, setNumOutputs] = useState(1);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { prompt: "" }
  });

  const { data: generations = [] } = useQuery<Generation[]>({
    queryKey: ["/api/generations"],
    refetchInterval: (query) => {
      const data = query.state.data as Generation[] | undefined;
      const hasProcessing = data?.some(g => g.status === "processing" || g.status === "pending");
      return hasProcessing ? 3000 : false;
    },
  });

  const videoGenerations = generations.filter(g => g.type === "video2video");

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string }) => {
      return apiRequest("POST", "/api/generations", {
        ...data,
        type: "video2video",
        model: selectedModel,
        aspectRatio,
        resolution,
        duration,
        numOutputs,
        sourceVideoUrl: uploadedVideo,
        creditsCost: numOutputs * 20,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: "動画を生成しています..." });
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
        <h1 className="text-xl font-bold">動画から動画を生成</h1>

        {/* Video Upload */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <FolderOpen className="w-4 h-4 mr-2" />
              ライブラリ
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              アップロード
            </Button>
          </div>
          
          <div 
            className="border-2 border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            data-testid="video-upload-area"
          >
            {uploadedVideo ? (
              <video src={uploadedVideo} className="w-full h-full object-contain rounded-lg" controls />
            ) : (
              <>
                <Film className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  参考動画を元に、イメージしているシーンを説明してください
                </p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              {...register("prompt")}
              placeholder="参考動画を元に、イメージしているシーンを説明してください"
              className="min-h-24 resize-none bg-card"
              data-testid="prompt-input"
            />
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" className="text-xs text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                最適化
              </Button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">モデル</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48" data-testid="model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {videoModels.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name} ({m.creditsCost}cr)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
              モデル一覧を見る
            </Button>

            <div className="flex items-center justify-between">
              <span className="text-sm">アスペクト比</span>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-48">
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
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">長さ</span>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm">カメラ固定</span>
                <p className="text-xs text-muted-foreground mt-1">
                  有効にすると、カメラは固定されたままになります。無効にすると、カメラはプロンプトに基づいて動的に移動します。
                </p>
              </div>
              <Switch checked={cameraFixed} onCheckedChange={setCameraFixed} />
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            disabled={generateMutation.isPending || !selectedModel}
            data-testid="generate-button"
          >
            {generateMutation.isPending ? "生成中..." : `作成 ⬦ ${numOutputs * 20}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">想定生成時間: 25s 〜 70s</p>
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

        {videoGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <Film className="w-12 h-12 mb-4 opacity-50" />
            <p>まだ生成された動画がありません</p>
            <p className="text-sm">動画をアップロードして生成を開始してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videoGenerations.map((gen, idx) => (
              <Card key={gen.id} className="bg-card border-border" data-testid={`generation-card-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 mb-3">
                    <Badge variant="secondary">動画から動画を生成</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(gen.createdAt!).toLocaleString("ja-JP")}</span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-2">{gen.prompt}</p>
                  
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                    {gen.videoUrl ? (
                      <video src={gen.videoUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <Play className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

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
                      <Heart className="w-4 h-4" />
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
