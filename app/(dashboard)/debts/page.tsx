"use client";

import React, { useState, useEffect } from "react";
import { format, addMonths } from "date-fns";
import { th } from "date-fns/locale";
import { PlusCircle, CreditCard, Calendar as CalendarIcon, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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

// กำหนด Type ให้กับข้อมูลหนี้
type Debt = {
  id: number;
  name: string;
  total_amount: number;
  monthly_payment: number;
  remaining_installments: number | null;
  start_date: string | null;
  interest_rate: number | null;
};

export default function DebtsPage() {
  const supabase = createClient();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- State สำหรับฟอร์มเพิ่มหนี้ ---
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [remainingInstallments, setRemainingInstallments] = useState("");
  const [interestRate, setInterestRate] = useState("");

  // ฟังก์ชันดึงข้อมูลหนี้ทั้งหมดของผู้ใช้
  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        } else {
            toast.error("ดึงข้อมูลหนี้สินล้มเหลว");
        }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // ฟังก์ชันคำนวณ Progress (0 - 100%)
  const calculateProgress = (debt: Debt) => {
    if (!debt.remaining_installments || !debt.total_amount) return 0;
    
    const remainingBalance = debt.remaining_installments * debt.monthly_payment;
    const paidAmount = debt.total_amount - remainingBalance;
    
    if (paidAmount <= 0) return 0;
    
    const progress = (paidAmount / debt.total_amount) * 100;
    return Math.min(Math.max(progress, 0), 100); // ให้อยู่ในช่วง 0-100
  };

  // ฟังก์ชันคำนวณวันที่คาดว่าจะปิดหนี้
  const calculatePayoffDate = (remainingMonths: number | null) => {
    if (!remainingMonths) return "ไม่ระบุ";
    const payoffDate = addMonths(new Date(), remainingMonths);
    return format(payoffDate, "MMMM yyyy", { locale: th });
  };

  // ฟังก์ชันบันทึกหนี้ใหม่
  const handleAddDebt = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !monthlyPayment) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้งาน");

      const { error } = await supabase.from("debts").insert({
        user_id: user.id,
        name: name,
        total_amount: parseFloat(totalAmount),
        monthly_payment: parseFloat(monthlyPayment),
        remaining_installments: remainingInstallments ? parseInt(remainingInstallments) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("เพิ่มรายการหนี้สำเร็จ");
      setIsDialogOpen(false);
      
      // รีเซ็ตฟอร์ม
      setName("");
      setTotalAmount("");
      setMonthlyPayment("");
      setRemainingInstallments("");
      setInterestRate("");
      
      // อัปเดตรายการ
      fetchDebts();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    }
  };

  // คำนวณสรุปยอดหนี้รวม
  const totalMonthlyDebtPayment = debts.reduce((sum, debt) => sum + Number(debt.monthly_payment), 0);
  const totalRemainingDebt = debts.reduce((sum, debt) => {
    if (debt.remaining_installments) {
      return sum + (debt.remaining_installments * debt.monthly_payment);
    }
    // ถ้าไม่ระบุงวดที่เหลือ ให้ใช้ยอดรวมแทน
    return sum + Number(debt.total_amount);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการหนี้สิน</h1>
          <p className="text-muted-foreground mt-2">ติดตามและวางแผนการปลดหนี้ของคุณ</p>
        </div>

        {/* ปุ่มเปิด Pop-up เพิ่มหนี้ใหม่ */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> เพิ่มหนี้ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มรายการหนี้ใหม่</DialogTitle>
              <DialogDescription>กรอกรายละเอียดหนี้ของคุณเพื่อช่วยในการติดตามและคำนวณ</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDebt} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ชื่อรายการ (เช่น รถดำ, KTC)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ยอดหนี้ทั้งหมด (บาท)</Label>
                  <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>ยอดผ่อนต่อเดือน (บาท)</Label>
                  <Input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>จำนวนงวดที่เหลือ (เดือน)</Label>
                  <Input type="number" value={remainingInstallments} onChange={(e) => setRemainingInstallments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ดอกเบี้ยต่อปี (% - ถ้ามี)</Label>
                  <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4">บันทึกรายการ</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* การ์ดสรุปหนี้สินรวม */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400">ภาระผ่อนต่อเดือนรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-500">
              ฿{totalMonthlyDebtPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-800 dark:text-slate-400">ยอดหนี้คงเหลือโดยประมาณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">
              ฿{totalRemainingDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* รายการหนี้สิน */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground p-4">กำลังโหลดข้อมูล...</p>
        ) : debts.length === 0 ? (
          <Card className="col-span-full p-8 text-center border-dashed">
            <p className="text-muted-foreground mb-4">ยังไม่มีรายการหนี้สินในระบบ</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              เพิ่มรายการแรกของคุณ
            </Button>
          </Card>
        ) : (
          debts.map((debt) => {
            const progress = calculateProgress(debt);
            return (
              <Card key={debt.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      {debt.name}
                    </CardTitle>
                    <span className="text-sm font-bold text-rose-500">
                      -฿{debt.monthly_payment.toLocaleString()}/เดือน
                    </span>
                  </div>
                  <CardDescription>
                    ยอดรวม: ฿{debt.total_amount.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 grow space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>ความคืบหน้า</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                    <div className="bg-muted/50 p-2 rounded-md">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3" /> งวดที่เหลือ
                      </p>
                      <p className="font-medium">{debt.remaining_installments ? `${debt.remaining_installments} งวด` : 'ไม่ระบุ'}</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <CalendarIcon className="w-3 h-3" /> คาดว่าจะปิดได้
                      </p>
                      <p className="font-medium text-primary">{calculatePayoffDate(debt.remaining_installments)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}