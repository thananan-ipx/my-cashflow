import React, { useState } from "react";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Budget } from "@/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { saveBudget } from "@/features/budgets/services/budget.service";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetTabProps {
  budgets: Budget[];
  isLoading: boolean;
  currentMonth: number;
  currentYear: number;
  onRefresh: () => void;
}

export function BudgetTab({ budgets, isLoading, currentMonth, currentYear, onRefresh }: BudgetTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const handleAddBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category || !amount) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      const existing = budgets.find((b) => b.category === category);
      // เรียกใช้ Service ที่เราแยกไว้
      await saveBudget(category, parseFloat(amount), currentMonth, currentYear, existing?.id);

      toast.success("บันทึกงบประมาณสำเร็จ");
      setIsOpen(false);
      setCategory("");
      setAmount("");
      onRefresh(); // สั่งให้ดึงข้อมูลใหม่
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* ส่วนหัว และปุ่มเพิ่มงบประมาณ */}
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> ตั้งงบประมาณใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ตั้งงบประมาณรายเดือน</DialogTitle>
              <DialogDescription>กำหนดวงเงินสูงสุดที่คุณต้องการใช้ในแต่ละหมวดหมู่</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBudget} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>วงเงินงบประมาณ (บาท)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-4">
                บันทึกงบประมาณ
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ส่วนแสดงรายการงบประมาณ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">กำลังโหลด...</p>
        ) : budgets.length === 0 ? (
          <Card className="col-span-full p-8 text-center border-dashed">
            <p className="text-muted-foreground">ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้</p>
          </Card>
        ) : (
          budgets.map((budget) => {
            const spent = budget.spent || 0;
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const isWarning = percentage >= 80 && percentage < 100;
            const isOver = percentage >= 100;

            return (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {CATEGORY_LABELS[budget.category] || budget.category}
                    </CardTitle>
                    {isOver && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  </div>
                  <CardDescription>งบ: ฿{budget.amount.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className={isOver ? "text-rose-500" : ""}>
                      ใช้ไป: ฿{spent.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      เหลือ: ฿{Math.max(budget.amount - spent, 0).toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorColor={
                      isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary"
                    }
                  />
                  {isWarning && (
                    <p className="text-xs text-amber-500 mt-2">ระวัง! ใช้ไปกว่า 80% ของงบแล้ว</p>
                  )}
                  {isOver && (
                    <p className="text-xs text-rose-500 mt-2">เกินงบประมาณที่ตั้งไว้!</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}