"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, PlusCircle, Filter, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

import { Category, Debt, Transaction } from "@/types";
import { OWNER_OPTIONS } from "@/lib/constants";
import { fetchTransactions, deleteTransaction } from "@/features/transactions/services/transaction.action";
import { fetchCategories } from "@/features/categories/services/category.action";
import { fetchDebts } from "@/features/debts/services/debt.action";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AddTransactionDialog } from "@/features/transactions/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/features/transactions/components/EditTransactionDialog";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]); 
  
  // Filter States
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // UI States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = date?.from ? startOfDay(date.from).toISOString() : null;
      const toDate = date?.to ? endOfDay(date.to).toISOString() : null;

      const [cats, debts, txs] = await Promise.all([
        fetchCategories(),
        fetchDebts(),
        fetchTransactions(fromDate, toDate)
      ]);

      setCategories(cats);
      setActiveDebts(debts);
      setTransactions(txs);
    } catch (error) {
      if (error instanceof Error) toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [date?.from, date?.to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number, type: "income" | "expense") => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;
    try {
      await deleteTransaction(id, type);
      toast.success("ลบรายการสำเร็จ");
      loadData();
    } catch (error) {
      if (error instanceof Error) toast.error("ลบรายการล้มเหลว: " + error.message);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === "all" || t.type === filterType;
      const matchOwner = filterOwner === "all" || t.owner === filterOwner;
      return matchType && matchOwner;
    });
  }, [transactions, filterType, filterOwner]);

  const handleClearFilters = () => {
    setDate(undefined);
    setFilterType("all");
    setFilterOwner("all");
  };

  const hasFilters = date !== undefined || filterType !== "all" || filterOwner !== "all";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ประวัติรายการ</h1>
          <p className="text-muted-foreground mt-2">ตรวจสอบ แก้ไข และลบรายการรายรับ-รายจ่ายของคุณ</p>
        </div>

        <Button className="flex items-center gap-2" onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="w-4 h-4" /> เพิ่มรายการใหม่
        </Button>
      </div>

      <AddTransactionDialog 
        isOpen={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        categories={categories} 
        activeDebts={activeDebts} 
        onSuccess={loadData} 
      />

      <EditTransactionDialog
        isOpen={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        onSuccess={loadData}
      />

      {/* ส่วนจัดการตัวกรอง (Filters) */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 bg-muted/30 p-4 rounded-lg border items-end">
        <div className="space-y-1.5 flex-1 min-w-60 max-w-75">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3"/> ช่วงวันที่</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-background", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>{format(date.from, "d MMM yyyy", { locale: th })} - {format(date.to, "d MMM yyyy", { locale: th })}</>
                  ) : (format(date.from, "d MMM yyyy", { locale: th }))
                ) : (<span>แสดงทั้งหมด (ทุกช่วงเวลา)</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={th} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5 flex-1 min-w-37.5 max-w-50">
          <Label className="text-xs text-muted-foreground">ของใคร?</Label>
          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="ทุกคน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคน (รวมกองกลาง)</SelectItem>
              {OWNER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-37.5 max-w-50">
          <Label className="text-xs text-muted-foreground">ประเภทรายการ</Label>
          <Select value={filterType} onValueChange={(val) => setFilterType(val as "all" | "income" | "expense")}>
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

        {hasFilters && (
          <Button 
            variant="ghost" 
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground mb-0.5"
          >
            <XCircle className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      <TransactionTable 
        transactions={filteredTransactions} 
        isLoading={isLoading} 
        onEdit={setEditingTransaction} 
        onDelete={handleDelete} 
      />
    </div>
  );
}