"use client"

import * as React from "react"
import {
  Command,
  Settings2,
  LayoutDashboard,
  PlugZap,
  ShoppingCart,
  FileSpreadsheet,
  History,
  CircleDollarSign,
  BellRing
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
import { UserResponseType } from "@/types/user/user-response-type"

const data = {
  user: {
    id: "user-1",
    name: "Admin User",
    email: "admin@xyy.com",
    avatar: "",
  },
  navMain: [
    {
      title: "จัดการคำสั่งซื้อ (Orders & Sync)",
      url: "/orders",
      icon: ShoppingCart,
      isActive: false,
    },
    {
      title: "กระทบยอดการเงิน (Reconcile)",
      url: "/reconciliation",
      icon: CircleDollarSign,
      isActive: false,
    },
    {
      title: "ประวัติการทำงาน (Logs)",
      url: "/logs",
      icon: History,
      isActive: false,
    },
    {
      title: "ตั้งค่าระบบ",
      url: "#",
      icon: Settings2,
      role: "Admin",
      items: [
        {
          title: "เชื่อมต่อแพลตฟอร์ม (API)",
          url: "/integrations",
          icon: PlugZap,
          role: "Admin"
        },
        {
          title: "จัดการผู้ใช้งาน",
          url: "/users",
          role: "Admin"
        },
        {
          title: "ตั้งค่าการแจ้งเตือน",
          url: "/notifications",
          icon: BellRing,
          role: "Admin"
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // จำลองข้อมูล User สำหรับ Prototype
  const [userItem, setuserItem] = React.useState<UserResponseType>({
    id: 1,
    rowNumber: 1,
    name: "Admin User",
    email: "admin@xyy.com",
    phone: "",
    role: "Admin", // บังคับเป็น Admin ก่อนเพื่อดูเมนู
    status: "Active",
    departmentId: 1,
    department: "ผู้บริหาร",
    createdAt: "",
    updatedAt: "",
  })

  const navMainWithState = React.useMemo(() => {
    return data.navMain
      .filter(item => {
        if (item.role && item.role !== userItem.role) return false
        return true
      })
      .map((item) => {
        const filteredItems = item.items?.filter((subItem) => {
          if (!subItem.role) return true
          return subItem.role === userItem.role
        })

        const isChildActive = filteredItems?.some((subItem) =>
          pathname.startsWith(subItem.url)
        )

        return {
          ...item,
          items: filteredItems,
          isActive: isChildActive || pathname.startsWith(item.url),
        }
      })
  }, [userItem.role, pathname])

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
                  <span className="truncate font-medium">XYY Order System</span>
                  <span className="truncate text-xs">Data Integration</span>
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