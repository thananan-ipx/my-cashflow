"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NavUser({
  user: initialUser,
}: {
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState({
    name: initialUser.name,
    email: initialUser.email,
    avatar: initialUser.avatar,
  })

  useEffect(() => {
    async function getUser() {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        setUser({
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || "User",
          email: supabaseUser.email || "",
          avatar: supabaseUser.user_metadata?.avatar_url || "",
        })
      }
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push("/")
      router.refresh()
      toast.success("ออกจากระบบสำเร็จ")
    } catch (error) {
      if (error instanceof Error) {
        toast.error("ออกจากระบบล้มเหลว: " + error.message)
      }
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent/50 transition-all rounded-lg"
            >
              <Avatar className="h-9 w-9 rounded-full border border-sidebar-border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                <span className="truncate font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl p-2"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              บัญชีผู้ใช้
            </DropdownMenuLabel>
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="h-10 w-10 rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-muted">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : <User className="size-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => toast.info("ฟีเจอร์นี้กำลังพัฒนา")} className="rounded-lg gap-2 cursor-pointer">
                <KeyRound className="size-4 text-muted-foreground" />
                รีเซ็ตรหัสผ่าน
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="size-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}