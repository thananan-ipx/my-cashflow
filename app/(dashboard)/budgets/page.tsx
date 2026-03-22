"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { PlusCircle, PiggyBank, Target, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// --- Types ---
type Budget = {
  id: number;
  category: string;
  amount: number;
  spent?: number; // เราจะคำนวณเพิ่มเข้ามาเอง
};

type SavingGoal = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
};

// แปลงชื่อหมวดหมู่ภาษาอังกฤษเป็นไทย
const categoryLabels: Record<string, string> = {
  food: "อาหาร/ของใช้",
  car: "รถยนต์/เดินทาง",
  rent: "ค่าที่พัก/บ้าน",
  debt: "ชำระหนี้",
  subscription: "บริการรายเดือน (Sub)",
  utility: "ค่าน้ำ/ค่าไฟ/เน็ต",
  other: "อื่นๆ",
};

export default function BudgetsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);

  // Dialog States
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Form States - Budget
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  // Form States - Saving Goal
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState("0");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  
  // Form State - Add Funds
  const [addFundsAmount, setAddFundsAmount] = useState("");

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // --- ฟังก์ชันดึงข้อมูล ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. ดึงข้อมูล Budgets เดือนปัจจุบัน
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear);
      if (budgetError) throw budgetError;

      // 2. ดึงข้อมูล Expenses เดือนปัจจุบันเพื่อมาคำนวณยอดใช้จ่าย
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("category, amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear);
      if (expenseError) throw expenseError;

      // 3. รวมยอดใช้จ่ายเข้ากับ Budget แต่ละหมวด
      const expensesByCategory = (expenseData || []).reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
      }, {});

      const budgetsWithSpent = (budgetData || []).map((b: any) => ({
        ...b,
        spent: expensesByCategory[b.category] || 0,
      }));
      setBudgets(budgetsWithSpent);

      // 4. ดึงข้อมูลเป้าหมายการออม
      const { data: goalsData, error: goalsError } = await supabase
        .from("saving_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (goalsError) throw goalsError;
      setSavingGoals(goalsData || []);

    } catch (error: any) {
      toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ฟังก์ชันจัดการฟอร์ม ---
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory || !budgetAmount) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้งาน");

      // เช็คว่าเคยตั้งงบหมวดนี้ในเดือนนี้หรือยัง
      const existing = budgets.find(b => b.category === budgetCategory);
      if (existing) {
        // อัปเดตงบเดิม
        const { error } = await supabase
          .from("budgets")
          .update({ amount: parseFloat(budgetAmount) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // สร้างงบใหม่
        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category: budgetCategory,
          amount: parseFloat(budgetAmount),
          month: currentMonth,
          year: currentYear,
        });
        if (error) throw error;
      }

      toast.success("บันทึกงบประมาณสำเร็จ");
      setIsBudgetOpen(false);
      setBudgetCategory("");
      setBudgetAmount("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTargetAmount) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้งาน");

      const { error } = await supabase.from("saving_goals").insert({
        user_id: user.id,
        name: goalName,
        target_amount: parseFloat(goalTargetAmount),
        current_amount: parseFloat(goalCurrentAmount || "0"),
        target_date: goalTargetDate || null,
      });
      if (error) throw error;

      toast.success("เพิ่มเป้าหมายการออมสำเร็จ");
      setIsGoalOpen(false);
      setGoalName("");
      setGoalTargetAmount("");
      setGoalCurrentAmount("0");
      setGoalTargetDate("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !addFundsAmount) return toast.error("กรุณาระบุจำนวนเงิน");

    const goal = savingGoals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    try {
      const newAmount = goal.current_amount + parseFloat(addFundsAmount);
      const { error } = await supabase
        .from("saving_goals")
        .update({ current_amount: newAmount })
        .eq("id", selectedGoalId);
      if (error) throw error;

      toast.success(`เพิ่มเงินออมสำเร็จ ยอดปัจจุบัน: ฿${newAmount.toLocaleString()}`);
      setIsAddFundsOpen(false);
      setAddFundsAmount("");
      setSelectedGoalId(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">งบประมาณ & การออม</h1>
        <p className="text-muted-foreground mt-2">
          ควบคุมค่าใช้จ่ายประจำเดือน {format(currentDate, "MMMM yyyy", { locale: th })} และติดตามเป้าหมายของคุณ
        </p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="budgets">งบประมาณเดือนนี้</TabsTrigger>
          <TabsTrigger value="savings">เป้าหมายการออม</TabsTrigger>
        </TabsList>

        {/* ---------------- แท็บงบประมาณ ---------------- */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
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
                    <Select value={budgetCategory} onValueChange={setBudgetCategory} required>
                      <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>วงเงินงบประมาณ (บาท)</Label>
                    <Input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full mt-4">บันทึกงบประมาณ</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

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
                        <CardTitle className="text-lg">{categoryLabels[budget.category] || budget.category}</CardTitle>
                        {isOver && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      </div>
                      <CardDescription>งบ: ฿{budget.amount.toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-1.5 font-medium">
                        <span className={isOver ? "text-rose-500" : ""}>ใช้ไป: ฿{spent.toLocaleString()}</span>
                        <span className="text-muted-foreground">
                          เหลือ: ฿{Math.max(budget.amount - spent, 0).toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2" 
                        // ใส่สีให้ Progress bar
                        indicatorColor={isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary"}
                      />
                      {isWarning && <p className="text-xs text-amber-500 mt-2">ระวัง! ใช้ไปกว่า 80% ของงบแล้ว</p>}
                      {isOver && <p className="text-xs text-rose-500 mt-2">เกินงบประมาณที่ตั้งไว้!</p>}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ---------------- แท็บเป้าหมายการออม ---------------- */}
        <TabsContent value="savings" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Target className="w-4 h-4" /> สร้างเป้าหมายใหม่
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างเป้าหมายการออม</DialogTitle>
                  <DialogDescription>เช่น กองทุนสำรองฉุกเฉิน, ดาวน์บ้าน, ท่องเที่ยว</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddGoal} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>ชื่อเป้าหมาย</Label>
                    <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="เช่น กองทุนสำรองฉุกเฉิน" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ยอดเป้าหมาย (บาท)</Label>
                      <Input type="number" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>ยอดตั้งต้น (ถ้ามี)</Label>
                      <Input type="number" value={goalCurrentAmount} onChange={(e) => setGoalCurrentAmount(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่คาดว่าจะสำเร็จ (ไม่บังคับ)</Label>
                    <Input type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full mt-4">สร้างเป้าหมาย</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <p className="text-muted-foreground">กำลังโหลด...</p>
            ) : savingGoals.length === 0 ? (
              <Card className="col-span-full p-8 text-center border-dashed">
                <p className="text-muted-foreground">ยังไม่มีเป้าหมายการออม</p>
              </Card>
            ) : (
              savingGoals.map((goal) => {
                const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                const isComplete = percentage >= 100;

                return (
                  <Card key={goal.id} className={isComplete ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <PiggyBank className="w-4 h-4 text-primary" /> {goal.name}
                          </CardTitle>
                          {goal.target_date && (
                            <CardDescription className="mt-1">
                              เป้าหมาย: {format(new Date(goal.target_date), "MMM yyyy", { locale: th })}
                            </CardDescription>
                          )}
                        </div>
                        {isComplete && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">สำเร็จ! 🎉</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-lg">฿{goal.current_amount.toLocaleString()}</span>
                          <span className="text-muted-foreground">จาก ฿{goal.target_amount.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" indicatorColor={isComplete ? "bg-emerald-500" : "bg-primary"} />
                        <p className="text-right text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
                      </div>
                      
                      {!isComplete && (
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setIsAddFundsOpen(true);
                            }}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" /> อัปเดตเงินออม
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog สำหรับอัปเดตเงินออมเพิ่ม */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มเงินออม</DialogTitle>
            <DialogDescription>บันทึกยอดเงินที่คุณออมเพิ่มในเป้าหมายนี้</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFunds} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>จำนวนเงินที่ออมเพิ่ม (บาท)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  className="pl-8" 
                  placeholder="0.00"
                  value={addFundsAmount} 
                  onChange={(e) => setAddFundsAmount(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full">อัปเดตยอด</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}