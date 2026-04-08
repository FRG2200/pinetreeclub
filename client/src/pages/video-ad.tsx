import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Download, Play, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdScript {
  productName: string;
  headline: string;
  tagline: string;
  scenes: Array<{ time: string; caption: string; visual: string }>;
  voiceover: string;
  hashtags: string[];
  targetAudience: string;
}

interface ScriptResult {
  product: { title: string; url: string; ogImage: string };
  script: AdScript;
}

const STAGES = ["URLスキャン中...", "商品情報を解析中...", "スクリプトを生成中...", "動画をレンダリング中..."];

export default function VideoAdPage() {
  const [url, setUrl] = useState("");
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const { toast } = useToast();

  const generateScript = useMutation({
    mutationFn: async (productUrl: string) => {
      const res = await apiRequest("POST", "/api/generate-ad", { url: productUrl });
      return res.json() as Promise<ScriptResult>;
    },
    onSuccess: async (data) => {
      setScriptResult(data);
      setStage(3);
      await renderVideo(data.script);
    },
    onError: (err: Error) => {
      setStage(-1);
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    },
  });

  const renderMutation = useMutation({
    mutationFn: async (props: AdScript & { productImageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/render-video-ad", props);
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      setVideoUrl(data.url);
      setStage(4);
    },
    onError: (err: Error) => {
      toast({ title: "レンダリングエラー", description: err.message, variant: "destructive" });
      setStage(-1);
    },
  });

  async function renderVideo(script: AdScript) {
    await renderMutation.mutateAsync({
      ...script,
      productImageUrl: scriptResult?.product.ogImage,
    });
  }

  async function handleGenerate() {
    if (!url.trim()) return;
    setStage(0);
    setScriptResult(null);
    setVideoUrl(null);

    // Simulate stage progression
    setTimeout(() => setStage(1), 800);
    setTimeout(() => setStage(2), 1800);

    await generateScript.mutateAsync(url.trim());
  }

  const isLoading = stage >= 0 && stage < 4;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🎬</span>
          <Badge variant="outline" className="text-xs tracking-widest uppercase border-primary/40 text-primary">
            NEW — Remotion Powered
          </Badge>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">AI Video Ad Generator</h1>
        <p className="text-muted-foreground text-lg">
          商品URLを貼るだけ。AI＋Remotionが12秒SNS広告動画を自動生成します。
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-3 mb-8">
        <Input
          type="url"
          placeholder="https://example.com/product"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleGenerate()}
          disabled={isLoading}
          className="flex-1 h-12 text-base bg-card border-border/50 focus:border-primary"
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !url.trim()}
          className="h-12 px-8 font-bold"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STAGES[stage] || "処理中..."}</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />広告を生成</>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {STAGES.map((label, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= stage ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">{STAGES[stage]}</p>
        </div>
      )}

      {/* Results */}
      {scriptResult && (
        <div className="space-y-6">
          {/* Script Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "商品名", value: scriptResult.script.productName },
              { label: "ヘッドライン", value: scriptResult.script.headline },
              { label: "ターゲット", value: scriptResult.script.targetAudience },
              { label: "動画尺", value: "12秒 / 9:16" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border/50 rounded-xl p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
                <div className="font-bold text-sm leading-tight">{value}</div>
              </div>
            ))}
          </div>

          {/* Scenes */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">シーン構成</div>
            <div className="space-y-3">
              {scriptResult.script.scenes.map((scene, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-16 shrink-0 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1 text-center">
                    <span className="text-primary font-bold text-xs">{scene.time}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-0.5">{scene.caption}</div>
                    <div className="text-muted-foreground text-xs">{scene.visual}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2">
            {scriptResult.script.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-primary">{tag}</Badge>
            ))}
          </div>

          {/* Video Output */}
          {videoUrl ? (
            <div className="bg-card border border-primary/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-widest">Remotion レンダリング完了</span>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-black shrink-0 mx-auto" style={{ width: 200, aspectRatio: "9/16" }}>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">ナレーション</div>
                    <p className="text-sm leading-relaxed">{scriptResult.script.voiceover}</p>
                  </div>
                  <a
                    href={videoUrl}
                    download="video-ad.mp4"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                    MP4をダウンロード
                  </a>
                </div>
              </div>
            </div>
          ) : stage === 3 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Remotionで動画をレンダリング中... (30秒〜2分)</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Info footer */}
      {stage === -1 && !scriptResult && (
        <div className="mt-12 grid md:grid-cols-3 gap-4 text-sm">
          {[
            { icon: "🔗", title: "URL貼るだけ", desc: "商品ページを自動スキャン" },
            { icon: "🤖", title: "Claude AI解析", desc: "スクリプト・コピー自動生成" },
            { icon: "🎬", title: "Remotionレンダリング", desc: "720×1280 / 30fps / 12秒MP4" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-card border border-border/30 rounded-xl p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-bold mb-1">{title}</div>
              <div className="text-muted-foreground text-xs">{desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
