export const CATEGORY_LABELS: Record<string, string> = {
  food: "อาหาร/ของใช้",
  car: "รถยนต์/เดินทาง",
  rent: "ค่าที่พัก/บ้าน",
  debt: "ชำระหนี้",
  subscription: "บริการรายเดือน (Sub)",
  utility: "ค่าน้ำ/ค่าไฟ/เน็ต",
  other: "อื่นๆ",
};

export const OWNER_OPTIONS = [
  { value: "joint", label: "กองกลาง (ใช้ร่วมกัน)", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "new", label: "นิว", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
  { value: "save", label: "เซฟ", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
];