"use client"

import * as React from "react"
import { Command, Settings2 } from "lucide-react"
import { usePathname } from "next/navigation"

import { NAV_ITEMS } from "@/lib/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    id: "user-1",
    name: "My Cash Flow User",
    email: "user@example.com",
    avatar: "",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMainWithState = React.useMemo(() => {
    return [
      ...NAV_ITEMS.map((item) => ({
        title: item.title,
        url: item.url,
        icon: item.icon,
        isActive: pathname.startsWith(item.url),
      })),
      {
        title: "ตั้งค่าระบบ",
        url: "/settings",
        icon: Settings2,
        isActive: pathname.startsWith("/settings"),
        items: [
          {
            title: "ประเภทรายการ",
            url: "/categories",
            icon: "Tags",
            isActive: pathname === "/categories",
          },
        ],
      },
    ]
  }, [pathname])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">My Cash Flow</span>
                  <span className="truncate text-xs">Personal Finance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithState} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}