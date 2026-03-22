import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">

        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 min-w-0">

          <header className="flex h-16 shrink-0 items-center gap-2 ">

            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 mt-2 data-[orientation=vertical]:h-4"
              />
              <AppBreadcrumb />
            </div>

          </header>

          <main className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 p-6 md:p-8 pt-6 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </main>

        </SidebarInset>

      </div>

    </SidebarProvider>
  )
}