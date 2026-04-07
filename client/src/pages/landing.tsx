import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowRight, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";

const heroVideos = [
  "/hero/videos/hero1.mp4",
  "/hero/videos/hero2.mp4",
  "/hero/videos/hero3.mp4",
  "/hero/videos/hero4.mp4",
  "/hero/videos/hero5.mp4",
  "/hero/videos/hero6.mp4",
  "/hero/videos/hero7.mp4",
];

const showcaseImages = [
  { src: "/hero/images/showcase1.png", alt: "AI Generated - Rosérie" },
  { src: "/hero/images/showcase2.png", alt: "AI Generated - Voggue" },
  { src: "/hero/images/showcase3.png", alt: "AI Generated - Vaxis" },
  { src: "/hero/images/showcase4.png", alt: "AI Generated - Portrait" },
  { src: "/hero/images/showcase5.png", alt: "AI Generated - Neo Doers AI" },
  { src: "/hero/images/showcase6.png", alt: "AI Generated - Cyberpunk" },
  { src: "/hero/images/showcase7.png", alt: "AI Generated - Fashion" },
  { src: "/hero/images/showcase8.png", alt: "AI Generated - Elegance" },
  { src: "/hero/images/showcase9.png", alt: "AI Generated - Street Style" },
];

const generationCards = [
  {
    title: "テキストから動画生成",
    description: "テキストプロンプトからビデオを作成",
    href: "/text-to-video",
    icon: "video",
  },
  {
    title: "画像から動画生成",
    description: "画像をシームレスにアニメーション化",
    href: "/image-to-video",
    icon: "img2vid",
  },
  {
    title: "テキストから画像生成",
    description: "高品質な画像を即座に生成",
    href: "/text-to-image",
    icon: "image",
  },
  {
    title: "画像編集",
    description: "AIでスタイルを維持・再構成",
    href: "/image-edit",
    icon: "edit",
  },
];

const modelTabs = [
  "GPT-Image-1",
  "Flux Kontext Pro",
  "Midjourney V7",
  "Seedream 4.5",
  "Kling 3.0",
  "Veo 3 Fast",
  "Sora 2",
  "Runway Aleph",
];

export default function LandingPage() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [nextVideo, setNextVideo] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  const goToNextVideo = useCallback(() => {
    const next = (currentVideo + 1) % heroVideos.length;
    setNextVideo(next);
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentVideo(next);
      setIsTransitioning(false);
    }, 1000);
  }, [currentVideo]);

  useEffect(() => {
    const timer = setInterval(goToNextVideo, 8000);
    return () => clearInterval(timer);
  }, [goToNextVideo]);

  const handlePrev = () => {
    const prev = (currentVideo - 1 + heroVideos.length) % heroVideos.length;
    setNextVideo(prev);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentVideo(prev);
      setIsTransitioning(false);
    }, 1000);
  };

  const handleNext = () => {
    goToNextVideo();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Pine tree club" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold text-lg text-white">Pine tree club</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="/inspiration" className="hover:text-white transition-colors">インスピレーション</Link>
            <Link href="/model-ranking" className="hover:text-white transition-colors">画像</Link>
            <Link href="/apps" className="hover:text-white transition-colors">動画</Link>
            <a href="/pricing" className="hover:text-white transition-colors">料金</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <a href="/auth" data-testid="login-button">ログイン</a>
            </Button>
            <Button size="sm" className="bg-white text-black hover:bg-white/90 font-semibold" asChild>
              <a href="/auth" data-testid="get-started-button">今すぐ始める</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative h-screen overflow-hidden" data-testid="hero-section">
        <video
          ref={videoRef}
          key={`current-${currentVideo}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
          src={heroVideos[currentVideo]}
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />
        <video
          ref={nextVideoRef}
          key={`next-${nextVideo}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isTransitioning ? "opacity-100" : "opacity-0"}`}
          src={heroVideos[nextVideo]}
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-24">
          <div className="container mx-auto px-8">
            <div className="max-w-2xl mb-10">
              <p className="text-white/60 text-xs font-medium tracking-[0.3em] uppercase mb-4">AI-Powered Creative Studio</p>
              <h1 className="text-5xl md:text-7xl font-light text-white leading-[0.95] mb-6 tracking-tight">
                想像を、<br />
                <span className="font-semibold">現実に。</span>
              </h1>
              <p className="text-white/70 text-lg font-light max-w-lg leading-relaxed mb-8">
                30以上のAIモデルで、テキストから画像・動画を生成。
                あなたのクリエイティブを次のレベルへ。
              </p>
              <div className="flex items-center gap-4">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold px-8 h-12 text-base rounded-full" asChild>
                  <a href="/auth" data-testid="hero-cta">無料で始める <ArrowRight className="w-4 h-4 ml-2" /></a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-medium px-8 h-12 text-base rounded-full" asChild>
                  <Link href="/inspiration">作品を見る</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {heroVideos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNextVideo(idx);
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentVideo(idx);
                        setIsTransitioning(false);
                      }, 1000);
                    }}
                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentVideo ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50"}`}
                    data-testid={`hero-dot-${idx}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
                  data-testid="mute-toggle"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
                  data-testid="hero-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
                  data-testid="hero-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {generationCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all cursor-pointer group p-4 h-full" data-testid={`card-${card.href.replace("/", "")}`}>
                  <h3 className="text-foreground font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{card.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    今すぐ試す <ArrowRight className="w-3 h-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-3">Showcase</p>
          <h2 className="text-3xl font-light text-foreground">AIが生み出す、無限の表現</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px]">
          {showcaseImages.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden group cursor-pointer ${
                idx === 0 ? "md:col-span-2 md:row-span-2" : 
                idx === 4 ? "md:col-span-2" : ""
              }`}
              data-testid={`showcase-image-${idx}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs font-medium">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-8 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-3">Models</p>
          <h2 className="text-3xl font-light text-foreground mb-4">30以上のAIモデル</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">最先端のAIモデルを一つのプラットフォームで。画像生成から動画制作まで、あらゆるニーズに対応。</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {modelTabs.map((tab) => (
            <Badge
              key={tab}
              variant="outline"
              className="text-xs px-4 py-1.5 rounded-full border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 cursor-pointer transition-colors"
              data-testid={`tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {tab}
            </Badge>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" className="rounded-full px-8" asChild>
            <Link href="/model-ranking">すべてのモデルを見る <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border/50 py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl font-light text-primary mb-2">30+</p>
              <p className="text-sm text-muted-foreground">AIモデル</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light text-primary mb-2">6</p>
              <p className="text-sm text-muted-foreground">生成モード</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light text-primary mb-2">4K</p>
              <p className="text-sm text-muted-foreground">高解像度出力</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Pine tree club" className="h-5 w-5 rounded object-cover" />
              <span>Pine tree club</span>
            </div>
            <p>All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
