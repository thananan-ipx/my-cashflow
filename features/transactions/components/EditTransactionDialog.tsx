// features/transactions/components/EditTransactionDialog.tsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner";

import { Category, Transaction } from "@/types";
import { OWNER_OPTIONS } from "@/lib/constants";
import { updateIncome, updateExpense } from "@/features/transactions/services/transaction.action";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  onSuccess: () => void;
}

export function EditTransactionDialog({ isOpen, onOpenChange, transaction, categories, onSuccess }: EditTransactionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [owner, setOwner] = useState("joint");

  useEffect(() => {
    if (transaction && isOpen) {
      setAmount(transaction.amount.toString());
      setNote(transaction.note || "");
      setOwner(transaction.owner || "joint");
      setFormDate(new Date(transaction.date));
      setCategoryId(transaction.category_id?.toString() || "");
      setSubCategory(transaction.sub_category || "");
    }
  }, [transaction, isOpen]);

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transaction || !amount || !categoryId || !formDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    setIsSaving(true);
    try {
      if (transaction.type === "expense") {
        await updateExpense(transaction.id, {
          amount: parseFloat(amount),
          categoryId: parseInt(categoryId),
          subCategory: subCategory,
          formDate: formDate,
          note: note,
          owner: owner,
        });
      } else {
        await updateIncome(transaction.id, {
          amount: parseFloat(amount),
          categoryId: parseInt(categoryId),
          formDate: formDate,
          note: note,
          owner: owner,
        });
      }

      toast.success("อัปเดตรายการสำเร็จ");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  const options = categories.filter((c) => c.type === transaction.type);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>แก้ไข{transaction.type === "expense" ? "รายจ่าย" : "รายรับ"}</DialogTitle>
          <DialogDescription>แก้ไขรายละเอียดของรายการนี้</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4">
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
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {options.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {transaction.type === "expense" && (
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
          
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}