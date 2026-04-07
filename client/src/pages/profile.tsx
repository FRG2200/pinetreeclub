import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Grid, List, Heart, Play, Star } from "lucide-react";
import type { Generation } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: generations = [] } = useQuery<Generation[]>({
    queryKey: ["/api/generations"],
  });

  const { data: credits } = useQuery<{ planCredits: number; additionalCredits: number; plan: string }>({
    queryKey: ["/api/credits"],
  });

  const filteredGenerations = generations.filter(gen => {
    if (filter === "images" && gen.type.includes("video")) return false;
    if (filter === "videos" && !gen.type.includes("video")) return false;
    return gen.isPublic;
  });

  const planLabel = credits?.plan === "free" ? "Standard" : credits?.plan || "Standard";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-8 px-8">
        <div className="bg-card rounded-xl p-6 mb-8">
          <div className="flex items-start gap-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-2xl bg-muted">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-lg font-bold">
                  {user?.firstName || user?.email?.split("@")[0] || "User"}
                </h1>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {planLabel}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">No bio set yet.</p>
            </div>
            <Button variant="outline" size="sm" data-testid="edit-profile-button">
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">全て</TabsTrigger>
              <TabsTrigger value="images">画像</TabsTrigger>
              <TabsTrigger value="videos">動画</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="view-grid-button"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="view-list-button"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {filteredGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-48 h-48 mb-6" data-testid="empty-state-mascot">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="kimonoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
                <ellipse cx="100" cy="75" rx="45" ry="50" fill="url(#hairGradient)" />
                <circle cx="100" cy="80" r="35" fill="#fde4d8" />
                <ellipse cx="85" cy="75" rx="5" ry="6" fill="#1a1a1a" />
                <ellipse cx="115" cy="75" rx="5" ry="6" fill="#1a1a1a" />
                <circle cx="83" cy="73" r="1.5" fill="white" />
                <circle cx="113" cy="73" r="1.5" fill="white" />
                <ellipse cx="75" cy="85" rx="8" ry="4" fill="#ffb4a2" opacity="0.6" />
                <ellipse cx="125" cy="85" rx="8" ry="4" fill="#ffb4a2" opacity="0.6" />
                <path d="M 92 92 Q 100 98 108 92" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M 55 130 Q 100 110 145 130 L 155 190 Q 100 195 45 190 Z" fill="url(#kimonoGradient)" />
                <path d="M 70 130 Q 100 120 130 130 L 130 150 Q 100 145 70 150 Z" fill="#fde4d8" />
                <path d="M 85 145 L 115 145" stroke="#dc2626" strokeWidth="2" />
                <path d="M 45 140 Q 20 145 15 170 Q 10 190 35 195" fill="#fde4d8" />
                <path d="M 155 140 Q 180 145 185 170 Q 190 190 165 195" fill="#fde4d8" />
                <ellipse cx="55" cy="30" rx="15" ry="20" fill="url(#hairGradient)" />
                <ellipse cx="145" cy="30" rx="15" ry="20" fill="url(#hairGradient)" />
                <path d="M 60 25 Q 100 15 140 25" stroke="url(#hairGradient)" strokeWidth="20" fill="none" />
              </svg>
            </div>
            <p className="text-lg font-medium">データなし</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="masonry-grid">
            {filteredGenerations.map((gen, idx) => (
              <div key={gen.id} className="masonry-item group relative rounded-lg overflow-hidden cursor-pointer" data-testid={`profile-item-${idx}`}>
                {gen.imageUrl && (
                  <img 
                    src={gen.imageUrl} 
                    alt={gen.prompt || ""}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                {gen.type.includes("video") && (
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">{gen.model}</Badge>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-white hover:text-primary">
                      <Heart className={`w-4 h-4 ${gen.isFavorite ? "fill-primary text-primary" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGenerations.map((gen, idx) => (
              <div key={gen.id} className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border" data-testid={`profile-list-item-${idx}`}>
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {gen.imageUrl && (
                    <img src={gen.imageUrl} alt={gen.prompt || ""} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gen.prompt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{gen.type}</Badge>
                    <Badge variant="outline" className="text-xs">{gen.model}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
