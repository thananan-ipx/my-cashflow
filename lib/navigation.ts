import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  PieChart, 
  Tags, 
  CreditCard, 
  Users 
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "แดชบอร์ด",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "รายรับ-รายจ่าย",
    url: "/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "งบประมาณ & การออม",
    url: "/budgets",
    icon: PieChart,
  },
  {
    title: "จัดการผู้ใช้งาน",
    url: "/users",
    icon: Users,
  },
  {
    title: "จัดการหนี้สิน",
    url: "/debts",
    icon: CreditCard,
  },
] as const;
