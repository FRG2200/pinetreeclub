import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";

export interface VideoAdProps {
  productName: string;
  headline: string;
  tagline: string;
  scenes: Array<{ time: string; caption: string; visual: string }>;
  hashtags: string[];
  accentColor?: string;
  productImageUrl?: string;
  brandName?: string;
}

const ACCENT = "#4F46E5";
const FPS = 30;
const SCENE_FRAMES = 120; // 4 seconds each

/* ── Animated Word ── */
function Word({ text, startFrame, delay = 0 }: { text: string; startFrame: number; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame - delay;
  const progress = spring({ frame: localFrame, fps, config: { damping: 80, stiffness: 200, mass: 0.6 } });
  const y = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <span style={{ display: "inline-block", transform: `translateY(${y}px)`, opacity, marginRight: 8 }}>
      {text}
    </span>
  );
}

/* ── Scene 1: Hook / Headline (frames 0–119) ── */
function HookScene({ headline, tagline, accentColor }: Pick<VideoAdProps, "headline" | "tagline" | "accentColor">) {
  const frame = useCurrentFrame();
  const accent = accentColor || ACCENT;

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const lineScale = spring({ frame: frame - 10, fps: FPS, config: { damping: 100, stiffness: 300, mass: 0.4 } });
  const tagY = interpolate(frame, [45, 70], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [45, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dotPulse = interpolate(frame % 60, [0, 30, 60], [0.8, 1.4, 0.8]);

  const headlineWords = headline.split(/\s+/);

  return (
    <AbsoluteFill style={{ background: "#050510", opacity: bgOpacity, overflow: "hidden" }}>
      {/* BG gradient orbs */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #7C3AED20 0%, transparent 70%)", filter: "blur(40px)" }} />

      {/* Live badge */}
      <div style={{ position: "absolute", top: 50, left: 30, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 16px" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", transform: `scale(${dotPulse})` }} />
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, fontFamily: "system-ui, sans-serif", fontWeight: 600, letterSpacing: 2 }}>AI GENERATED</span>
      </div>

      {/* Accent line */}
      <div style={{ position: "absolute", top: "30%", left: 30, width: `${lineScale * 60}px`, height: 3, background: `linear-gradient(90deg, ${accent}, #7C3AED)`, borderRadius: 2 }} />

      {/* Headline */}
      <div style={{ position: "absolute", top: "33%", left: 30, right: 30, fontSize: 72, fontWeight: 900, color: "#fff", fontFamily: "system-ui, sans-serif", lineHeight: 1.1, letterSpacing: -2 }}>
        {headlineWords.map((word, i) => (
          <Word key={i} text={word} startFrame={15} delay={i * 6} />
        ))}
      </div>

      {/* Tagline */}
      <div style={{ position: "absolute", top: "58%", left: 30, right: 30, fontSize: 32, color: "rgba(255,255,255,0.65)", fontFamily: "system-ui, sans-serif", fontWeight: 400, lineHeight: 1.4, transform: `translateY(${tagY}px)`, opacity: tagOpacity }}>
        {tagline}
      </div>

      {/* Bottom grid line */}
      <div style={{ position: "absolute", bottom: 120, left: 30, right: 30, height: 1, background: "rgba(255,255,255,0.08)" }} />
    </AbsoluteFill>
  );
}

/* ── Scene 2: Product / Feature (frames 120–239) ── */
function ProductScene({ scene, productImageUrl, accentColor }: { scene: { caption: string; visual: string }; productImageUrl?: string; accentColor?: string }) {
  const frame = useCurrentFrame();
  const accent = accentColor || ACCENT;
  const localFrame = frame;

  const cardY = interpolate(spring({ frame: localFrame, fps: FPS, config: { damping: 80, stiffness: 200 } }), [0, 1], [80, 0]);
  const imgOpacity = interpolate(localFrame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const captionY = interpolate(localFrame, [30, 60], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const captionOpacity = interpolate(localFrame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shimmer = interpolate(localFrame % 90, [0, 45, 90], [-200, 400, -200]);

  return (
    <AbsoluteFill style={{ background: "#0a0a1a", overflow: "hidden" }}>
      {/* BG */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #050510 0%, #0d0d2a 100%)` }} />

      {/* Product image or placeholder */}
      <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", width: 340, height: 340, borderRadius: 28, overflow: "hidden", opacity: imgOpacity, border: `1px solid ${accent}40`, boxShadow: `0 0 60px ${accent}30` }}>
        {productImageUrl ? (
          <img src={productImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="product" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${accent}30, #7C3AED30)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 80 }}>✨</span>
          </div>
        )}
        {/* Shimmer overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`, backgroundPositionX: shimmer, backgroundSize: "600px 100%" }} />
      </div>

      {/* Caption card */}
      <div style={{ position: "absolute", bottom: 140, left: 24, right: 24, transform: `translateY(${captionY}px)`, opacity: captionOpacity }}>
        <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${accent}40`, borderRadius: 20, padding: "20px 24px", backdropFilter: "blur(20px)" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", fontFamily: "system-ui, sans-serif", lineHeight: 1.3, marginBottom: 8 }}>{scene.caption}</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>{scene.visual}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 70, left: 24, right: 24, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${(localFrame / SCENE_FRAMES) * 100}%`, background: `linear-gradient(90deg, ${accent}, #7C3AED)`, borderRadius: 2 }} />
      </div>
    </AbsoluteFill>
  );
}

/* ── Scene 3: CTA (frames 240–359) ── */
function CTAScene({ productName, hashtags, accentColor, brandName }: Pick<VideoAdProps, "productName" | "hashtags" | "accentColor" | "brandName">) {
  const frame = useCurrentFrame();
  const accent = accentColor || ACCENT;
  const localFrame = frame;

  const logoScale = spring({ frame: localFrame - 5, fps: FPS, config: { damping: 60, stiffness: 200 } });
  const textY = interpolate(localFrame, [20, 50], [50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textOpacity = interpolate(localFrame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const btnScale = spring({ frame: localFrame - 45, fps: FPS, config: { damping: 80, stiffness: 300 } });
  const pulse = interpolate(localFrame % 45, [0, 22, 45], [1, 1.04, 1]);
  const hashOpacity = interpolate(localFrame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* BG */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, #050510 0%, #0f0a2a 60%, #0a0510 100%)` }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}25 0%, transparent 65%)`, filter: "blur(80px)" }} />

      {/* Brand */}
      <div style={{ position: "absolute", top: 60, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `scale(${logoScale})`, background: `${accent}20`, border: `1px solid ${accent}50`, borderRadius: 16, padding: "10px 28px" }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>
            {brandName || productName}
          </span>
          <span style={{ fontSize: 26, color: accent }}>.</span>
        </div>
      </div>

      {/* Main CTA text */}
      <div style={{ position: "absolute", top: "35%", left: 30, right: 30, textAlign: "center", transform: `translateY(${textY}px)`, opacity: textOpacity }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", fontFamily: "system-ui, sans-serif", lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 20 }}>
          今すぐ<br />
          <span style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED, #EC4899)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            チェック。
          </span>
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", letterSpacing: 0.5 }}>
          {productName}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ position: "absolute", bottom: 180, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{
          transform: `scale(${btnScale * pulse})`,
          background: `linear-gradient(135deg, ${accent}, #7C3AED)`,
          borderRadius: 100,
          padding: "18px 60px",
          boxShadow: `0 0 40px ${accent}60`,
        }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>
            詳しく見る →
          </span>
        </div>
      </div>

      {/* Hashtags */}
      <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, opacity: hashOpacity, flexWrap: "wrap", padding: "0 24px" }}>
        {hashtags.slice(0, 4).map((tag, i) => (
          <span key={i} style={{ fontSize: 20, color: `${accent}cc`, fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>{tag}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/* ── Transition overlay ── */
function SceneTransition({ startFrame, duration = 12 }: { startFrame: number; duration?: number }) {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame > duration) return null;
  const opacity = interpolate(localFrame, [0, duration / 2, duration], [0, 1, 0]);
  return (
    <AbsoluteFill style={{ background: "#000", opacity, zIndex: 100 }} />
  );
}

/* ── Main Composition ── */
export const VideoAdComposition: React.FC<VideoAdProps> = ({
  productName,
  headline,
  tagline,
  scenes,
  hashtags,
  accentColor,
  productImageUrl,
  brandName,
}) => {
  const scene1 = scenes[0] || { caption: headline, visual: tagline };
  const scene2 = scenes[1] || { caption: productName, visual: "Check it out" };
  const scene3 = scenes[2] || { caption: "今すぐ", visual: "CTA" };

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={SCENE_FRAMES}>
        <HookScene headline={headline} tagline={tagline} accentColor={accentColor} />
      </Sequence>

      <Sequence from={SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
        <ProductScene scene={scene2} productImageUrl={productImageUrl} accentColor={accentColor} />
      </Sequence>

      <Sequence from={SCENE_FRAMES * 2} durationInFrames={SCENE_FRAMES}>
        <CTAScene productName={productName} hashtags={hashtags} accentColor={accentColor} brandName={brandName} />
      </Sequence>

      {/* Transitions */}
      <SceneTransition startFrame={SCENE_FRAMES - 8} />
      <SceneTransition startFrame={SCENE_FRAMES * 2 - 8} />
    </AbsoluteFill>
  );
};
