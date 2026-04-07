import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  PlusCircle,
  Image as ImageIcon,
  LogOut,
  User,
  Settings,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Create", href: "/create", icon: PlusCircle },
    { name: "Gallery", href: "/gallery", icon: ImageIcon },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-card/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Pine tree club
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuItem 
                onClick={() => logout()}
                className="text-destructive focus:text-destructive cursor-pointer rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-lg">Pine tree club</span>
          </Link>
          <div className="flex gap-2">
             <Link href="/create">
                <Button size="sm" variant="outline">Create</Button>
             </Link>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 {navigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem className="cursor-pointer">
                        <item.icon className="mr-2 h-4 w-4"/> {item.name}
                      </DropdownMenuItem>
                    </Link>
                 ))}
                 <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                   <LogOut className="mr-2 h-4 w-4" /> Log out
                 </DropdownMenuItem>
              </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full animate-in-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
