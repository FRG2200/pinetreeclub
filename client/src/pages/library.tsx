import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Play, Grid, List, Trash2, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Generation } from "@shared/schema";

export default function LibraryPage() {
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modelFilter, setModelFilter] = useState("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: generations = [], isLoading } = useQuery<Generation[]>({
    queryKey: ["/api/generations"],
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/generations/${id}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/generations/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
    },
  });

  const filteredGenerations = generations.filter(gen => {
    if (filter === "images" && (gen.type.includes("video") || !gen.imageUrl)) return false;
    if (filter === "videos" && !gen.type.includes("video")) return false;
    if (favoriteOnly && !gen.isFavorite) return false;
    if (modelFilter !== "all" && gen.model !== modelFilter) return false;
    return true;
  });

  const uniqueModels = Array.from(new Set(generations.map(g => g.model)));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">ライブラリ</h1>
        <div className="flex items-center gap-4">
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-40" data-testid="model-filter">
              <SelectValue placeholder="モデル" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全モデル</SelectItem>
              {uniqueModels.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={favoriteOnly}
              onChange={(e) => setFavoriteOnly(e.target.checked)}
            />
            お気に入り
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">全て</TabsTrigger>
            <TabsTrigger value="images" data-testid="filter-images">画像</TabsTrigger>
            <TabsTrigger value="videos" data-testid="filter-videos">動画</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="view-grid"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="view-list"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredGenerations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <div className="w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" 
              alt="Empty" 
              className="w-20 h-20 object-cover rounded-full opacity-50"
            />
          </div>
          <p className="text-lg">データなし</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="masonry-grid">
          {filteredGenerations.map((gen, idx) => (
            <div key={gen.id} className="masonry-item group relative rounded-lg overflow-hidden cursor-pointer" data-testid={`library-item-${idx}`}>
              {gen.imageUrl && (
                <img 
                  src={gen.imageUrl} 
                  alt={gen.prompt}
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
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{gen.model}</Badge>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-white hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate(gen.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${gen.isFavorite ? "fill-primary text-primary" : ""}`} />
                    </Button>
                    {(gen.imageUrl || gen.videoUrl) && gen.status === "completed" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-white hover:text-green-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/generations/${gen.id}/download`, "_blank");
                        }}
                        data-testid={`download-${gen.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-white hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(gen.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGenerations.map((gen, idx) => (
            <div key={gen.id} className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors" data-testid={`library-item-${idx}`}>
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {gen.imageUrl && (
                  <img src={gen.imageUrl} alt={gen.prompt} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{gen.prompt}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{gen.type}</Badge>
                  <Badge variant="outline" className="text-xs">{gen.model}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(gen.createdAt!).toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => toggleFavoriteMutation.mutate(gen.id)}
                >
                  <Heart className={`w-4 h-4 ${gen.isFavorite ? "fill-primary text-primary" : ""}`} />
                </Button>
                {(gen.imageUrl || gen.videoUrl) && gen.status === "completed" && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(`/api/generations/${gen.id}/download`, "_blank")}
                    data-testid={`download-list-${gen.id}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteMutation.mutate(gen.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
