import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { 
  Home,
  Star, 
  LayoutGrid, 
  Video,
  PenTool,
  Clapperboard,
  Film,
  FolderOpen,
  User,
  Zap,
  ImagePlus,
  FileVideo,
  Coins,
  Shield,
  Users,
  LogOut,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
}

const navSections = [
  {
    items: [
      { title: "Home", href: "/inspiration", icon: <Home className="w-4 h-4" /> },
      { title: "Ranking", href: "/model-ranking", icon: <Star className="w-4 h-4" /> },
      { title: "Apps", href: "/apps", icon: <LayoutGrid className="w-4 h-4" /> },
    ] as NavItem[]
  },
  {
    title: "Create",
    items: [
      { title: "Image", href: "/text-to-image", icon: <ImagePlus className="w-4 h-4" /> },
      { title: "Edit", href: "/image-edit", icon: <PenTool className="w-4 h-4" /> },
      { title: "Text to Video", href: "/text-to-video", icon: <FileVideo className="w-4 h-4" /> },
      { title: "Image to Video", href: "/image-to-video", icon: <Clapperboard className="w-4 h-4" /> },
      { title: "Ref Video", href: "/ref-image-to-video", icon: <Film className="w-4 h-4" /> },
      { title: "Transform", href: "/video-to-video", icon: <Video className="w-4 h-4" /> },
      { title: "Video Ad ✦", href: "/video-ad", icon: <Zap className="w-4 h-4" /> },
    ] as NavItem[]
  },
  {
    title: "Account",
    items: [
      { title: "Library", href: "/library", icon: <FolderOpen className="w-4 h-4" /> },
      { title: "Credits", href: "/credits-tasks", icon: <Coins className="w-4 h-4" /> },
      { title: "Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
    ] as NavItem[]
  }
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: credits } = useQuery<{ planCredits: number; additionalCredits: number }>({
    queryKey: ["/api/credits"],
  });

  const { data: whitelistStatus } = useQuery<{ allowed: boolean; isAdmin: boolean }>({
    queryKey: ["/api/whitelist/check"],
  });

  const totalCredits = credits ? credits.planCredits + credits.additionalCredits : 10;

  const sidebarStyle = {
    "--sidebar-width": "13rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r border-border/30">
          <SidebarHeader className="px-5 py-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home-logo">
                <span className="text-xs font-medium tracking-[0.25em] uppercase">Pine tree club</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2">
            {navSections.map((section, sectionIndex) => (
              <SidebarGroup key={sectionIndex} className="py-1">
                {section.title && (
                  <SidebarGroupLabel className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-normal px-3 mb-1">{section.title}</SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = location === item.href || (location === "/" && item.href === "/inspiration");
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={isActive} className="h-9 rounded-md">
                            <Link href={item.href} data-testid={`nav-${item.href.replace("/", "")}`}>
                              {item.icon}
                              <span className="text-[13px] font-light tracking-wide">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {whitelistStatus?.isAdmin && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-normal px-3 mb-1">Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/admin/users"} className="h-9 rounded-md">
                        <Link href="/admin/users" data-testid="nav-admin-users">
                          <Users className="w-4 h-4" />
                          <span className="text-[13px] font-light tracking-wide">Users</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/admin/whitelist"} className="h-9 rounded-md">
                        <Link href="/admin/whitelist" data-testid="nav-admin-whitelist">
                          <Shield className="w-4 h-4" />
                          <span className="text-[13px] font-light tracking-wide">Whitelist</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            <Link href="/pricing">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-primary/8 cursor-pointer border border-primary/10 hover-elevate" data-testid="credits-display">
                <Zap className="w-3.5 h-3.5 text-primary/70" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium block">{totalCredits} credits</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2.5 px-3 py-2">
              <Avatar className="w-6 h-6 border border-border/30">
                <AvatarFallback className="text-[10px] bg-muted font-light">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-light truncate flex-1">
                {user?.firstName || user?.email || "User"}
              </span>
              <button
                onClick={() => logout()}
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
