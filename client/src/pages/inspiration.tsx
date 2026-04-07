import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Image, Video, PenTool, Clapperboard, Film, Sparkles, Heart, Eye, Play } from "lucide-react";
import type { Inspiration } from "@shared/schema";

const heroSlides = [
  {
    title: "Create Without Limits",
    subtitle: "AI-Powered Visual Studio",
    description: "4Kの画像生成からシネマティック映像まで、プロフェッショナルなクリエイティブワークを。",
    video: "/hero/videos/hero1.mp4",
    poster: "/hero/images/showcase2.png",
    href: "/text-to-image",
  },
  {
    title: "Motion Redefined",
    subtitle: "Next-Gen Video Synthesis",
    description: "静止画に命を吹き込む。最先端のAIで、あなたのビジョンを映像に。",
    video: "/hero/videos/hero2.mp4",
    poster: "/hero/images/showcase3.png",
    href: "/text-to-video",
  },
  {
    title: "Imagine More",
    subtitle: "Beyond Imagination",
    description: "想像を超える美しさを、一瞬で。クリエイターのための究極のツール。",
    video: "/hero/videos/hero3.mp4",
    poster: "/hero/images/showcase6.png",
    href: "/text-to-image",
  },
];

const capabilities = [
  {
    title: "Image Generation",
    label: "テキストから画像",
    icon: Image,
    href: "/text-to-image",
    image: "/hero/images/showcase1.png",
  },
  {
    title: "Video Creation",
    label: "テキストから動画",
    icon: Video,
    href: "/text-to-video",
    image: "/hero/images/showcase7.png",
  },
  {
    title: "Image Editing",
    label: "AI画像編集",
    icon: PenTool,
    href: "/image-edit",
    image: "/hero/images/showcase9.png",
  },
  {
    title: "Image to Motion",
    label: "画像から動画",
    icon: Clapperboard,
    href: "/image-to-video",
    image: "/hero/images/showcase6.png",
  },
  {
    title: "Reference Video",
    label: "参照動画生成",
    icon: Film,
    href: "/ref-image-to-video",
    image: "/hero/images/showcase8.png",
  },
  {
    title: "Upscale & Transform",
    label: "動画を変換",
    icon: Sparkles,
    href: "/video-to-video",
    image: "/hero/images/showcase4.png",
  },
];

const showcaseItems = [
  { title: "4K Portrait", model: "Nano Banana Pro", image: "/hero/images/showcase6.png", href: "/text-to-image" },
  { title: "Fashion Editorial", model: "Seedream 4.5", image: "/hero/images/showcase2.png", href: "/text-to-image" },
  { title: "Neo Doers AI", model: "GPT-Image-1", image: "/hero/images/showcase5.png", href: "/text-to-image" },
];

const sampleInspirations: Inspiration[] = [
  { id: 1, userId: null, imageUrl: "/hero/images/showcase1.png", videoUrl: null, prompt: "K-pop group in rose garden", model: "Nano Banana Pro", type: "image", likes: 128, views: 1200, isFeatured: true, createdAt: new Date() },
  { id: 2, userId: null, imageUrl: "/hero/images/showcase2.png", videoUrl: null, prompt: "Voggue magazine cover", model: "GPT-Image-1", type: "image", likes: 256, views: 2300, isFeatured: true, createdAt: new Date() },
  { id: 3, userId: null, imageUrl: "/hero/images/showcase3.png", videoUrl: null, prompt: "Vaxis fashion editorial", model: "Seedream 4.5", type: "image", likes: 89, views: 890, isFeatured: false, createdAt: new Date() },
  { id: 4, userId: null, imageUrl: "/hero/images/showcase4.png", videoUrl: null, prompt: "Group portrait studio", model: "Seedream 4.5", type: "image", likes: 345, views: 3400, isFeatured: true, createdAt: new Date() },
  { id: 5, userId: null, imageUrl: "/hero/images/showcase5.png", videoUrl: null, prompt: "Neo Doers AI branding", model: "GPT-Image-1", type: "image", likes: 432, views: 4100, isFeatured: false, createdAt: new Date() },
  { id: 6, userId: null, imageUrl: "/hero/images/showcase6.png", videoUrl: null, prompt: "Cyberpunk portrait", model: "Flux Kontext Pro", type: "image", likes: 187, views: 1800, isFeatured: true, createdAt: new Date() },
  { id: 7, userId: null, imageUrl: "/hero/images/showcase7.png", videoUrl: null, prompt: "Fashion street style", model: "Midjourney V7", type: "image", likes: 567, views: 5600, isFeatured: true, createdAt: new Date() },
  { id: 8, userId: null, imageUrl: "/hero/images/showcase8.png", videoUrl: null, prompt: "Elegant portrait", model: "Nano Banana Pro", type: "image", likes: 234, views: 2100, isFeatured: false, createdAt: new Date() },
  { id: 9, userId: null, imageUrl: "/hero/images/showcase9.png", videoUrl: null, prompt: "Casual street fashion", model: "Recraft V3", type: "image", likes: 789, views: 7800, isFeatured: true, createdAt: new Date() },
];

function HeroVideo({ slide, isActive }: { slide: typeof heroSlides[0]; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  return (
    <div className={`absolute inset-0 transition-opacity ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: "1500ms" }} data-active={isActive}>
      <video
        ref={videoRef}
        src={slide.video}
        poster={slide.poster}
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

export default function InspirationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: inspirations = sampleInspirations } = useQuery<Inspiration[]>({
    queryKey: ["/api/inspirations"],
  });

  const displayItems = inspirations.length > 0 ? inspirations : sampleInspirations;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const currentHero = heroSlides[currentSlide];

  return (
    <div className="overflow-y-auto h-full bg-background" data-testid="inspiration-page">
      <div className="relative h-[85vh] min-h-[600px] overflow-hidden" data-testid="hero-carousel">
        {heroSlides.map((slide, idx) => (
          <HeroVideo key={idx} slide={slide} isActive={idx === currentSlide} />
        ))}

        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-12 lg:px-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-medium mb-4" data-testid="hero-eyebrow">
              {currentHero.subtitle}
            </p>
            <h1 className="text-6xl lg:text-8xl font-light text-white mb-6 tracking-tight leading-[0.9]" data-testid="hero-title">
              {currentHero.title}
            </h1>
            <p className="text-base text-white/50 mb-10 max-w-lg leading-relaxed font-light" data-testid="hero-description">
              {currentHero.description}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href={currentHero.href}>
                <Button data-testid="hero-cta">
                  Start Creating <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="border-white/15 text-white bg-white/5 backdrop-blur-sm" data-testid="hero-pricing-cta">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 right-12 lg:right-20 flex items-center gap-3 z-10">
          <Button
            size="icon"
            variant="outline"
            onClick={prevSlide}
            className="bg-white/5 backdrop-blur-md text-white/60 border-white/10"
            data-testid="hero-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="relative w-8 h-[2px] rounded-full overflow-hidden"
                data-testid={`hero-dot-${idx}`}
              >
                <div className="absolute inset-0 bg-white/20" />
                {idx === currentSlide && (
                  <div className="absolute inset-0 bg-white rounded-full animate-[slideProgress_7s_linear]" />
                )}
              </button>
            ))}
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={nextSlide}
            className="bg-white/5 backdrop-blur-md text-white/60 border-white/10"
            data-testid="hero-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-12 lg:px-20 py-20 space-y-28">
        <section data-testid="capabilities-section">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Capabilities</p>
              <h2 className="text-3xl font-light tracking-tight">あなたの創造力を解放する</h2>
            </div>
            <Link href="/apps">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="link-explore-tools">
                All Tools <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border/50 rounded-md overflow-hidden border border-border/50" data-testid="tool-cards-grid">
            {capabilities.map((cap, idx) => (
              <Link key={idx} href={cap.href}>
                <div className="relative bg-background p-8 flex flex-col justify-between min-h-[200px] cursor-pointer group" data-testid={`tool-card-${idx}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium tracking-wide mb-1">{cap.title}</h3>
                      <p className="text-xs text-muted-foreground">{cap.label}</p>
                    </div>
                    <cap.icon className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <div className="mt-6">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section data-testid="showcase-section">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Showcase</p>
              <h2 className="text-3xl font-light tracking-tight">Featured Works</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="showcase-grid">
            {showcaseItems.map((item, idx) => (
              <Link key={idx} href={item.href}>
                <div className="relative rounded-md overflow-hidden aspect-[5/4] cursor-pointer border border-border/30" data-testid={`showcase-item-${idx}`}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">{item.model}</p>
                    <h3 className="text-white text-lg font-light">{item.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section data-testid="gallery-section">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Gallery</p>
              <h2 className="text-3xl font-light tracking-tight">Community Creations</h2>
            </div>
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3" data-testid="community-grid">
            {displayItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="relative rounded-md overflow-hidden cursor-pointer break-inside-avoid border border-border/20"
                data-testid={`inspiration-item-${idx}`}
              >
                <img
                  src={item.imageUrl || ""}
                  alt={item.prompt || ""}
                  className="w-full object-cover"
                  style={{ minHeight: 180 }}
                />
                {item.type === "video" && (
                  <div className="absolute top-3 right-3">
                    <div className="w-7 h-7 bg-black/40 backdrop-blur-sm rounded-md flex items-center justify-center border border-white/10">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-light line-clamp-1">{item.prompt}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-white/40 text-[10px] flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {item.likes}
                    </span>
                    <span className="text-white/40 text-[10px] flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.views}
                    </span>
                    <span className="text-white/30 text-[10px] ml-auto font-light">{item.model}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border/30 pt-10 pb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm font-light tracking-widest uppercase text-muted-foreground">Pine tree club</span>
            <div className="flex gap-8 flex-wrap text-xs text-muted-foreground font-light tracking-wide">
              <Link href="/pricing">Terms</Link>
              <Link href="/pricing">Privacy</Link>
              <Link href="/pricing">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
