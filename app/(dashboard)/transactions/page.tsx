"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Filter, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Types ---
type Category = {
  id: number;
  type: "income" | "expense";
  name: string;
  color: string;
};

type Debt = {
  id: number;
  name: string;
  monthly_payment: number;
  remaining_installments: number | null;
};

type Transaction = {
  id: number;
  type: "income" | "expense";
  amount: number;
  category_id?: number | null; 
  category_name: string;
  category_color: string;
  sub_category?: string;
  note: string;
  date: string;
  is_fixed: boolean;
  owner: string; // เพิ่มฟิลด์ owner
};

// --- ตั้งค่ารายชื่อเจ้าของ (สามารถเปลี่ยนชื่อได้ตามต้องการ) ---
const ownerOptions = [
  { value: "joint", label: "กองกลาง (ใช้ร่วมกัน)", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "new", label: "นิว", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
  { value: "save", label: "เซฟ", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
];

export default function TransactionsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- States ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]); 
  
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterOwner, setFilterOwner] = useState<string>("all"); // State สำหรับ Filter Owner
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  
  const [incomeCategoryId, setIncomeCategoryId] = useState<string>("");
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("");
  const [subCategory, setSubCategory] = useState("");
  const [selectedDebtId, setSelectedDebtId] = useState<string>(""); 
  const [owner, setOwner] = useState<string>("joint"); // State เก็บค่าเจ้าของในฟอร์ม

  const resetForm = () => {
    setAmount("");
    setNote("");
    setIsFixed(false);
    setIncomeCategoryId("");
    setExpenseCategoryId("");
    setSubCategory("");
    setSelectedDebtId("");
    setOwner("joint");
    setFormDate(new Date());
  };

  const isDebtCategory = categories.find((c) => c.id.toString() === expenseCategoryId)?.name.includes("หนี้") || false;

  // --- ฟังก์ชันดึงข้อมูลรายการ ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: catsData } = await supabase.from("transaction_categories").select("*").eq("user_id", user.id);
      setCategories(catsData || []);

      const { data: debtsData } = await supabase.from("debts").select("id, name, monthly_payment, remaining_installments").eq("user_id", user.id).eq("is_active", true);
      setActiveDebts(debtsData || []);

      const fromDate = date?.from ? startOfDay(date.from).toISOString() : null;
      const toDate = date?.to ? endOfDay(date.to).toISOString() : null;

      let expQuery = supabase.from("expenses").select(`*, transaction_categories(name, color)`).eq("user_id", user.id);
      if (date?.from && date?.to) {
        expQuery = expQuery.gte("date", format(date.from, "yyyy-MM-dd")).lte("date", format(date.to, "yyyy-MM-dd"));
      }
      const { data: expenses, error: expError } = await expQuery;
      if (expError) throw expError;

      let incQuery = supabase.from("income").select(`*, transaction_categories(name, color)`).eq("user_id", user.id);
      if (fromDate && toDate) {
        incQuery = incQuery.gte("created_at", fromDate).lte("created_at", toDate);
      }
      const { data: incomes, error: incError } = await incQuery;
      if (incError) throw incError;

      const formattedExpenses: Transaction[] = (expenses || []).map((e: any) => ({
        id: e.id, type: "expense", amount: Number(e.amount), category_id: e.category_id,
        category_name: e.transaction_categories?.name || e.category || "อื่นๆ",
        category_color: e.transaction_categories?.color || "#f43f5e",
        sub_category: e.sub_category, note: e.note || "", date: e.date, is_fixed: e.is_fixed,
        owner: e.owner || "joint" // ดึงค่า owner
      }));

      const formattedIncomes: Transaction[] = (incomes || []).map((i: any) => ({
        id: i.id, type: "income", amount: Number(i.amount), category_id: i.category_id,
        category_name: i.transaction_categories?.name || i.source || "อื่นๆ",
        category_color: i.transaction_categories?.color || "#10b981",
        note: i.note || "", date: format(new Date(i.created_at), "yyyy-MM-dd"), is_fixed: i.is_fixed,
        owner: i.owner || "joint" // ดึงค่า owner
      }));

      const combined = [...formattedExpenses, ...formattedIncomes].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTransactions(combined);
    } catch (error: any) {
      toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  // --- ฟังก์ชันบันทึกรายรับ ---
  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !incomeCategoryId || !formDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const { error } = await supabase.from("income").insert({
        user_id: user.id, amount: parseFloat(amount), category_id: parseInt(incomeCategoryId),
        is_fixed: isFixed, month: formDate.getMonth() + 1, year: formDate.getFullYear(),
        note: note, created_at: formDate.toISOString(), owner: owner // บันทึก owner
      });

      if (error) throw error;
      toast.success("บันทึกรายรับสำเร็จ");
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- ฟังก์ชันบันทึกรายจ่าย ---
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !expenseCategoryId || !formDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    if (isDebtCategory && !selectedDebtId) return toast.error("กรุณาเลือกหนี้สินที่ต้องการชำระ");

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const { error } = await supabase.from("expenses").insert({
        user_id: user.id, amount: parseFloat(amount), category_id: parseInt(expenseCategoryId),
        sub_category: subCategory, is_fixed: isFixed, date: format(formDate, "yyyy-MM-dd"),
        month: formDate.getMonth() + 1, year: formDate.getFullYear(), note: note,
        owner: owner // บันทึก owner
      });

      if (error) throw error;

      if (isDebtCategory && selectedDebtId) {
        const targetDebt = activeDebts.find((d) => d.id.toString() === selectedDebtId);
        if (targetDebt && targetDebt.remaining_installments !== null && targetDebt.remaining_installments > 0) {
          let installmentsToDeduct = Math.max(1, Math.round(parseFloat(amount) / targetDebt.monthly_payment));
          const newRemaining = Math.max(0, targetDebt.remaining_installments - installmentsToDeduct);

          const { error: debtError } = await supabase.from("debts").update({
            remaining_installments: newRemaining,
            is_active: newRemaining > 0
          }).eq("id", targetDebt.id);

          if (debtError) throw debtError;

          if (newRemaining === 0) toast.success(`คุณผ่อน "${targetDebt.name}" หมดเรียบร้อยแล้ว 🎉`);
          else toast.success(`หักงวด ${targetDebt.name} แล้ว (เหลือ ${newRemaining} งวด)`);
        }
      } else {
        toast.success("บันทึกรายจ่ายสำเร็จ");
      }

      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, type: "income" | "expense") => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;
    try {
      const table = type === "income" ? "income" : "expenses";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("ลบรายการสำเร็จ");
      fetchData();
    } catch (error: any) {
      toast.error("ลบรายการล้มเหลว: " + error.message);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchType = filterType === "all" || t.type === filterType;
    const matchOwner = filterOwner === "all" || t.owner === filterOwner;
    return matchType && matchOwner;
  });

  const expenseOptions = categories.filter((c) => c.type === "expense");
  const incomeOptions = categories.filter((c) => c.type === "income");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ประวัติรายการ</h1>
          <p className="text-muted-foreground mt-2">ตรวจสอบ แก้ไข และลบรายการรายรับ-รายจ่ายของคุณ</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> เพิ่มรายการใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>เพิ่มรายการใหม่</DialogTitle>
              <DialogDescription>เลือกประเภทเพื่อบันทึกรายรับหรือรายจ่าย</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="expense" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="expense">รายจ่าย</TabsTrigger>
                <TabsTrigger value="income">รายรับ</TabsTrigger>
              </TabsList>

              <TabsContent value="expense">
                <form onSubmit={handleSaveExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>จำนวนเงิน (บาท)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>วันที่</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formDate ? format(formDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formDate} onSelect={setFormDate} initialFocus locale={th} /></PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>หมวดหมู่หลัก</Label>
                      <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId} required>
                        <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                        <SelectContent>
                          {expenseOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isDebtCategory ? (
                      <div className="space-y-2">
                        <Label>เลือกหนี้สินที่ชำระ</Label>
                        <Select 
                          value={selectedDebtId} 
                          onValueChange={(val) => {
                            setSelectedDebtId(val);
                            const debt = activeDebts.find((d) => d.id.toString() === val);
                            if (debt) {
                              setSubCategory(debt.name); 
                              if (!amount) setAmount(debt.monthly_payment.toString()); 
                            }
                          }} 
                          required
                        >
                          <SelectTrigger><SelectValue placeholder="เลือกรายการหนี้" /></SelectTrigger>
                          <SelectContent>
                            {activeDebts.map((d) => (
                              <SelectItem key={d.id} value={d.id.toString()}>
                                {d.name} (฿{d.monthly_payment.toLocaleString()}/งวด)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>รายการย่อย (ถ้ามี)</Label>
                        <Input placeholder="เช่น ค่าหอ, ค่าไฟ" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} />
                      </div>
                    )}
                  </div>

                  {/* Dropdown เลือกเจ้าของรายการ */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Users className="w-4 h-4"/> รายการนี้เป็นของใคร?</Label>
                    <Select value={owner} onValueChange={setOwner} required>
                      <SelectTrigger><SelectValue placeholder="เลือกผู้ทำรายการ" /></SelectTrigger>
                      <SelectContent>
                        {ownerOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>บันทึกเพิ่มเติม (Note)</Label>
                    <Textarea placeholder="รายละเอียดเพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}</Button>
                </form>
              </TabsContent>

              <TabsContent value="income">
                <form onSubmit={handleSaveIncome} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>จำนวนเงิน (บาท)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>วันที่รับเงิน</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formDate ? format(formDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formDate} onSelect={setFormDate} initialFocus locale={th} /></PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>แหล่งที่มาของรายรับ</Label>
                      <Select value={incomeCategoryId} onValueChange={setIncomeCategoryId} required>
                        <SelectTrigger><SelectValue placeholder="เลือกแหล่งที่มา" /></SelectTrigger>
                        <SelectContent>
                          {incomeOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Users className="w-4 h-4"/> รายการนี้เป็นของใคร?</Label>
                      <Select value={owner} onValueChange={setOwner} required>
                        <SelectTrigger><SelectValue placeholder="เลือกผู้ทำรายการ" /></SelectTrigger>
                        <SelectContent>
                          {ownerOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>บันทึกเพิ่มเติม (Note)</Label>
                    <Textarea placeholder="รายละเอียดเพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกรายรับ"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-1.5 flex-1 max-w-[280px]">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3"/> ช่วงวันที่</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-background", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>{format(date.from, "d MMM yyyy", { locale: th })} - {format(date.to, "d MMM yyyy", { locale: th })}</>
                  ) : (format(date.from, "d MMM yyyy", { locale: th }))
                ) : (<span>เลือกช่วงเวลา</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={th} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5 flex-1 sm:max-w-[180px]">
          <Label className="text-xs text-muted-foreground">ของใคร?</Label>
          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="ทุกคน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคน (รวมกองกลาง)</SelectItem>
              {ownerOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 sm:max-w-[180px]">
          <Label className="text-xs text-muted-foreground">ประเภทรายการ</Label>
          <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">แสดงทั้งหมด</SelectItem>
              <SelectItem value="income">เฉพาะรายรับ</SelectItem>
              <SelectItem value="expense">เฉพาะรายจ่าย</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">วันที่</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="hidden md:table-cell w-[120px]">เจ้าของ</TableHead>
              <TableHead className="hidden lg:table-cell">รายละเอียด</TableHead>
              <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
              <TableHead className="w-[80px] text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex justify-center items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> กำลังโหลดข้อมูล...</div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  ไม่พบรายการในช่วงเวลาที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const ownerConf = ownerOptions.find(o => o.value === tx.owner) || ownerOptions[0];
                return (
                  <TableRow key={`${tx.type}-${tx.id}`}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(tx.date), "d MMM yy", { locale: th })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category_color }} />
                        <span>{tx.category_name}</span>
                        {tx.sub_category && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                            {tx.sub_category}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap", ownerConf.color)}>
                        {ownerConf.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                      {tx.note || "-"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-bold tabular-nums",
                      tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                        onClick={() => handleDelete(tx.id, tx.type)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}