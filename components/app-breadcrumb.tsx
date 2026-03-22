"use client"

import React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// กำหนดชื่อและการจับคู่ Path
const routeMapping: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Dashboard" },
  "/dashboard": { label: "แดชบอร์ด" },
  "/tasks": { label: "จัดการงานเอกสาร" },
  "/cases": { label: "จัดการงานเอกสาร" },
  "/customers": { label: "จัดการลูกค้า", parent: "ตั้งค่า" },
  "/users": { label: "จัดการผู้ใช้งาน", parent: "ตั้งค่า" },
  "/document-types": { label: "จัดการประเภทเอกสาร", parent: "ตั้งค่า" },
}

export function AppBreadcrumb() {
  const pathname = usePathname()

  // หา Config ของ Path ปัจจุบัน
  let currentPathConfig = routeMapping[pathname]

  // กรณีรองรับ Path ย่อย (เช่น /tasks/new) ให้ยึดตาม Path หลัก
  if (!currentPathConfig) {
    const mainPath = Object.keys(routeMapping).find(k => k !== "/" && pathname.startsWith(k))
    if (mainPath) {
      currentPathConfig = routeMapping[mainPath]
    }
  }

  // ถ้าหาไม่เจอ หรือเป็นหน้าแรก ให้แสดง Dashboard
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
        {/* ส่วน Parent (เช่น Settings) */}
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

        {/* ส่วนหน้าปัจจุบัน */}
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPathConfig.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}