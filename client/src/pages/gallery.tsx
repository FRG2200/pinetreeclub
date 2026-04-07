import { useGenerations } from "@/hooks/use-generations";
import LayoutShell from "@/components/layout-shell";
import { Loader2, AlertCircle, Calendar, Download, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function GalleryPage() {
  const { data: generations, isLoading, error } = useGenerations();

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">
              My <span className="text-primary">Gallery</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your history of generated artworks and videos.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
            <p className="text-lg">Loading your creations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Failed to load gallery</p>
          </div>
        ) : generations && generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No generations yet</h3>
            <p className="text-muted-foreground max-w-md text-center mb-6">
              Start creating amazing AI art today using the Create page.
            </p>
            <Button asChild>
              <a href="/create">Create Your First Art</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generations?.map((item) => (
              <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {/* Image Aspect Ratio Wrapper */}
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                      {item.status === "pending" ? (
                        <div className="flex flex-col items-center text-primary">
                          <Loader2 className="h-8 w-8 animate-spin mb-2" />
                          <span className="text-sm font-medium">Processing...</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No Image</span>
                      )}
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    {item.imageUrl && (
                      <>
                         <Button size="icon" variant="secondary" className="rounded-full">
                           <Download className="h-4 w-4" />
                         </Button>
                         <Button size="icon" variant="secondary" className="rounded-full">
                           <Share2 className="h-4 w-4" />
                         </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={item.type === 'video' ? 'secondary' : 'default'} className="uppercase text-[10px] tracking-wider">
                      {item.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 text-foreground/90 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
