"use client"

import * as React from "react"
import {
  Command,
  Settings2,
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  Tags,
} from "lucide-react"
import { usePathname } from "next/navigation"

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
  navMain: [
    {
      title: "แดชบอร์ด",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: "รายรับ-รายจ่าย",
      url: "/transactions",
      icon: Wallet,
      isActive: false,
    },
    {
      title: "จัดการหนี้สิน",
      url: "/debts",
      icon: CreditCard,
      isActive: false,
    },
    {
      title: "งบประมาณ & การออม",
      url: "/budgets",
      icon: PiggyBank,
      isActive: false,
    },
    {
      title: "ตั้งค่าระบบ",
      url: "/settings",
      icon: Settings2,
      isActive: false,
      items: [
        {
          title: "ประเภทรายการ",
          url: "/categories",
          icon: Tags,
          isActive: false,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMainWithState = React.useMemo(() => {
    return data.navMain.map((item) => {
      const isChildActive = item.url !== "#" && pathname.startsWith(item.url)
      return {
        ...item,
        isActive: isChildActive || pathname === item.url,
      }
    })
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