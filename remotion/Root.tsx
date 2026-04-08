import React from "react";
import { Composition } from "remotion";
import { VideoAdComposition, type VideoAdProps } from "./VideoAdComposition";

const defaultProps: VideoAdProps = {
  productName: "Pine Tree Club",
  headline: "AIで動画広告。秒速で。",
  tagline: "商品URLを貼るだけで完成するSNS広告",
  scenes: [
    { time: "0-4s", caption: "AIで動画広告。秒速で。", visual: "Animated headline burst" },
    { time: "4-8s", caption: "URLを貼るだけ", visual: "Product showcase with shimmer effect" },
    { time: "8-12s", caption: "今すぐチェック", visual: "CTA with pulsing button" },
  ],
  hashtags: ["#AI広告", "#動画制作", "#TikTok", "#Reels"],
  accentColor: "#4F46E5",
  brandName: "Pine Tree Club",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoAd"
      component={VideoAdComposition}
      durationInFrames={360}
      fps={30}
      width={720}
      height={1280}
      defaultProps={defaultProps}
    />
  );
};
