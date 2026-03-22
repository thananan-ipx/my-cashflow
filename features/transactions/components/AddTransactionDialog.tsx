// features/transactions/components/AddTransactionDialog.tsx
import React, { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner";

import { Category, Debt } from "@/types";
import { OWNER_OPTIONS } from "@/lib/constants";
import { addIncome, addExpense } from "@/features/transactions/services/transaction.action";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  activeDebts: Debt[];
  onSuccess: () => void;
}

export function AddTransactionDialog({ isOpen, onOpenChange, categories, activeDebts, onSuccess }: AddTransactionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [selectedDebtId, setSelectedDebtId] = useState(""); 
  const [owner, setOwner] = useState("joint");

  const resetForm = () => {
    setAmount("");
    setNote("");
    setIncomeCategoryId("");
    setExpenseCategoryId("");
    setSubCategory("");
    setSelectedDebtId("");
    setOwner("joint");
    setFormDate(new Date());
  };

  const isDebtCategory = categories.find((c) => c.id.toString() === expenseCategoryId)?.name.includes("หนี้") || false;
  const expenseOptions = categories.filter((c) => c.type === "expense");
  const incomeOptions = categories.filter((c) => c.type === "income");

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !expenseCategoryId || !formDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    if (isDebtCategory && !selectedDebtId) return toast.error("กรุณาเลือกหนี้สินที่ต้องการชำระ");

    setIsSaving(true);
    try {
      const targetDebt = isDebtCategory ? activeDebts.find((d) => d.id.toString() === selectedDebtId) : undefined;

      const result = await addExpense({
        amount: parseFloat(amount),
        categoryId: parseInt(expenseCategoryId),
        subCategory: subCategory,
        formDate: formDate,
        isFixed: false,
        note: note,
        owner: owner,
        debtId: targetDebt?.id,
        currentRemainingInstallments: targetDebt?.remaining_installments,
        monthlyPayment: targetDebt?.monthly_payment,
        debtName: targetDebt?.name
      });

      if (result) {
        if (result.isDebtPaidOff) toast.success(`คุณผ่อน "${result.debtName}" หมดเรียบร้อยแล้ว 🎉`);
        else toast.success(`หักงวด ${result.debtName} แล้ว (เหลือ ${result.newRemaining} งวด)`);
      } else {
        toast.success("บันทึกรายจ่ายสำเร็จ");
      }

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !incomeCategoryId || !formDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    setIsSaving(true);
    try {
      await addIncome({
        amount: parseFloat(amount),
        categoryId: parseInt(incomeCategoryId),
        formDate: formDate,
        isFixed: false,
        note: note,
        owner: owner
      });

      toast.success("บันทึกรายรับสำเร็จ");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Users className="w-4 h-4"/> รายการนี้เป็นของใคร?</Label>
                <Select value={owner} onValueChange={setOwner} required>
                  <SelectTrigger><SelectValue placeholder="เลือกผู้ทำรายการ" /></SelectTrigger>
                  <SelectContent>
                    {OWNER_OPTIONS.map((opt) => (
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
                      {OWNER_OPTIONS.map((opt) => (
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
  );
}