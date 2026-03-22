"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeMapping: Record<string, { label: string; parent?: string }> = {
  "/": { label: "แดชบอร์ด" },
  "/dashboard": { label: "แดชบอร์ด" },
  "/transactions": { label: "รายรับ-รายจ่าย" },
  "/debts": { label: "จัดการหนี้สิน" },
  "/budgets": { label: "งบประมาณ & การออม" },
  "/settings": { label: "ตั้งค่าระบบ" },
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  let currentPathConfig = routeMapping[pathname]

  if (!currentPathConfig) {
    const mainPath = Object.keys(routeMapping).find(k => k !== "/" && pathname.startsWith(k))
    if (mainPath) {
      currentPathConfig = routeMapping[mainPath]
    }
  }

  if (!currentPathConfig) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {currentPathConfig.parent && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" className="cursor-default">
                {currentPathConfig.parent}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}

        <BreadcrumbItem>
          <BreadcrumbPage>{currentPathConfig.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}