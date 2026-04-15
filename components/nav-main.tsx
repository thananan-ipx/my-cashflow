"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  title,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | string
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon | string
    }[]
  }[]
  title?: string
}) {
  const pathname = usePathname()

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{title}</SidebarGroupLabel>}
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const Icon = typeof item.icon === 'string' ? undefined : item.icon;
          
          if (item.items && item.items.length > 0) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={item.isActive} className="hover:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent/50">
                      {Icon && <Icon className="size-4" />}
                      <span className="font-medium">{item.title}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <SidebarMenuSub className="border-l-sidebar-border/50 ml-4">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                            <a href={subItem.url} className="text-muted-foreground hover:text-foreground">
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive} className="hover:bg-sidebar-accent/50 transition-colors">
                <a href={item.url} className="flex items-center gap-3">
                  {Icon && <Icon className="size-4" />}
                  <span className="font-medium">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}