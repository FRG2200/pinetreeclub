import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Image, Share, ArrowRight, Zap, Users, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface TaskWithProgress {
  task: {
    id: number;
    title: string;
    description: string | null;
    rewardCredits: number;
    requiredCount: number;
    taskType: string;
    isActive: boolean | null;
  };
  progress?: {
    id: number;
    userId: string;
    taskId: number;
    currentCount: number;
    isCompleted: boolean | null;
  };
}

const sampleTasks: TaskWithProgress[] = [
  { 
    task: { id: 1, title: "Publish your first work", description: "Share your first creation on your profile", rewardCredits: 2, requiredCount: 1, taskType: "share", isActive: true },
    progress: { id: 1, userId: "1", taskId: 1, currentCount: 0, isCompleted: false }
  },
  { 
    task: { id: 2, title: "Publish 10 works", description: "Share 10 creations on your profile", rewardCredits: 15, requiredCount: 10, taskType: "share", isActive: true },
    progress: { id: 2, userId: "1", taskId: 2, currentCount: 0, isCompleted: false }
  },
  { 
    task: { id: 3, title: "Generate 10 images", description: "Create a total of 10 images", rewardCredits: 3, requiredCount: 10, taskType: "image_generation", isActive: true },
    progress: { id: 3, userId: "1", taskId: 3, currentCount: 7, isCompleted: false }
  },
  { 
    task: { id: 4, title: "Generate 50 images", description: "Create a total of 50 images", rewardCredits: 10, requiredCount: 50, taskType: "image_generation", isActive: true },
    progress: { id: 4, userId: "1", taskId: 4, currentCount: 7, isCompleted: false }
  },
  { 
    task: { id: 5, title: "Generate 100 images", description: "Create a total of 100 images", rewardCredits: 25, requiredCount: 100, taskType: "image_generation", isActive: true },
    progress: { id: 5, userId: "1", taskId: 5, currentCount: 7, isCompleted: false }
  },
];

export default function CreditsTasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credits } = useQuery<{ planCredits: number; additionalCredits: number }>({
    queryKey: ["/api/credits"],
  });

  const { data: tasks = sampleTasks } = useQuery<TaskWithProgress[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      return await res.json() as { credits: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: `+${data.credits} credits earned` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalCredits = credits ? credits.planCredits + credits.additionalCredits : 37;
  const planCredits = credits?.planCredits || 8;
  const additionalCredits = credits?.additionalCredits || 29;

  const uncompletedTasks = (tasks.length > 0 ? tasks : sampleTasks).filter(t => !t.progress?.isCompleted);

  return (
    <div className="overflow-y-auto h-full bg-background">
      <div className="max-w-4xl mx-auto px-12 lg:px-20 py-16 space-y-20">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Account</p>
          <h1 className="text-3xl font-light tracking-tight">Credits & Tasks</h1>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 rounded-md overflow-hidden border border-border/50">
          <div className="bg-background p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-primary/60" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Balance</p>
            </div>
            <p className="text-4xl font-light mb-6">{totalCredits}</p>
            <div className="space-y-2 text-sm text-muted-foreground mb-8">
              <div className="flex justify-between gap-2">
                <span>Plan credits</span>
                <span>{planCredits}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Additional</span>
                <span>{additionalCredits}</span>
              </div>
            </div>
            <Link href="/pricing">
              <Button variant="outline" className="w-full" data-testid="buy-credits-button">
                Purchase Credits
              </Button>
            </Link>
          </div>

          <div className="bg-background p-8">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-muted-foreground/50" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Referral</p>
            </div>
            <p className="text-4xl font-light mb-2">+30</p>
            <p className="text-sm text-muted-foreground mb-8">credits per referral</p>
            <Button variant="outline" className="w-full" data-testid="invite-button">
              Invite Friends
            </Button>
          </div>

          <div className="bg-background p-8">
            <div className="flex items-center gap-2 mb-6">
              <Gift className="w-4 h-4 text-muted-foreground/50" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Daily</p>
            </div>
            <p className="text-4xl font-light mb-2">+2</p>
            <p className="text-sm text-muted-foreground">credits / day</p>
            <p className="text-xs text-muted-foreground mt-1 mb-6">Monthly cap: 20 credits</p>
            <Link href="/pricing">
              <Button className="w-full" data-testid="upgrade-button">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Earn More</p>
            <h2 className="text-2xl font-light tracking-tight">Tasks</h2>
          </div>

          <Tabs defaultValue="incomplete">
            <TabsList className="mb-6">
              <TabsTrigger value="incomplete" className="flex items-center gap-2">
                Active
                <Badge variant="secondary" className="text-xs no-default-active-elevate">{uncompletedTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="shared">Share</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="incomplete" className="space-y-2">
              {uncompletedTasks.map((item, idx) => {
                const progress = item.progress?.currentCount || 0;
                const required = item.task.requiredCount;
                const percentage = Math.min((progress / required) * 100, 100);
                const canClaim = progress >= required && !item.progress?.isCompleted;
                const IconComponent = item.task.taskType === "share" ? Share : Image;

                return (
                  <div key={item.task.id} className="flex items-center gap-4 p-4 border border-border/30 rounded-md" data-testid={`task-card-${idx}`}>
                    <div className="w-9 h-9 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-medium">{item.task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{progress}/{required}</p>
                        </div>
                        <span className="text-sm font-medium flex-shrink-0">+{item.task.rewardCredits}</span>
                      </div>
                      {percentage > 0 && percentage < 100 && (
                        <Progress value={percentage} className="h-1 mt-2" />
                      )}
                    </div>
                    <Button
                      variant={canClaim ? "default" : "outline"}
                      size="sm"
                      disabled={!canClaim}
                      onClick={() => canClaim && claimMutation.mutate(item.task.id)}
                      className="flex-shrink-0"
                      data-testid={`claim-task-${idx}`}
                    >
                      {canClaim ? "Claim" : "In Progress"}
                    </Button>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="shared">
              <p className="text-muted-foreground text-center py-12 text-sm font-light">No share tasks available</p>
            </TabsContent>

            <TabsContent value="image">
              <p className="text-muted-foreground text-center py-12 text-sm font-light">No image tasks available</p>
            </TabsContent>

            <TabsContent value="video">
              <p className="text-muted-foreground text-center py-12 text-sm font-light">No video tasks available</p>
            </TabsContent>

            <TabsContent value="completed">
              <p className="text-muted-foreground text-center py-12 text-sm font-light">No completed tasks yet</p>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
