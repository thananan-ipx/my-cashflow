import React, { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Target, PiggyBank, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { SavingGoal } from "@/types";
import { createSavingGoal, addFundsToGoal } from "@/features/budgets/services/budget.service";

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

interface SavingGoalTabProps {
  savingGoals: SavingGoal[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function SavingGoalTab({ savingGoals, isLoading, onRefresh }: SavingGoalTabProps) {
  // Dialog States
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Form States - Saving Goal
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState("0");
  const [goalTargetDate, setGoalTargetDate] = useState("");

  // Form State - Add Funds
  const [addFundsAmount, setAddFundsAmount] = useState("");

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!goalName || !goalTargetAmount) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

    try {
      await createSavingGoal(
        goalName,
        parseFloat(goalTargetAmount),
        parseFloat(goalCurrentAmount || "0"),
        goalTargetDate || null
      );

      toast.success("เพิ่มเป้าหมายการออมสำเร็จ");
      setIsGoalOpen(false);
      setGoalName("");
      setGoalTargetAmount("");
      setGoalCurrentAmount("0");
      setGoalTargetDate("");
      onRefresh(); // รีเฟรชข้อมูล
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const handleAddFunds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGoalId || !addFundsAmount) return toast.error("กรุณาระบุจำนวนเงิน");

    const goal = savingGoals.find((g) => g.id === selectedGoalId);
    if (!goal) return;

    try {
      const newAmount = await addFundsToGoal(
        selectedGoalId,
        goal.current_amount,
        parseFloat(addFundsAmount)
      );

      toast.success(`เพิ่มเงินออมสำเร็จ ยอดปัจจุบัน: ฿${newAmount.toLocaleString()}`);
      setIsAddFundsOpen(false);
      setAddFundsAmount("");
      setSelectedGoalId(null);
      onRefresh(); // รีเฟรชข้อมูล
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* ส่วนหัว และปุ่มสร้างเป้าหมาย */}
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
                <Input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="เช่น กองทุนสำรองฉุกเฉิน"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ยอดเป้าหมาย (บาท)</Label>
                  <Input
                    type="number"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ยอดตั้งต้น (ถ้ามี)</Label>
                  <Input
                    type="number"
                    value={goalCurrentAmount}
                    onChange={(e) => setGoalCurrentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>วันที่คาดว่าจะสำเร็จ (ไม่บังคับ)</Label>
                <Input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-4">
                สร้างเป้าหมาย
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ส่วนแสดงรายการเป้าหมายการออม */}
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
              <Card
                key={goal.id}
                className={
                  isComplete
                    ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PiggyBank className="text-primary w-4 h-4" /> {goal.name}
                      </CardTitle>
                      {goal.target_date && (
                        <CardDescription className="mt-1">
                          เป้าหมาย:{" "}
                          {format(new Date(goal.target_date), "MMM yyyy", { locale: th })}
                        </CardDescription>
                      )}
                    </div>
                    {isComplete && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 text-xs font-bold rounded-full">
                        สำเร็จ! 🎉
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-lg font-bold">
                        ฿{goal.current_amount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        จาก ฿{goal.target_amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorColor={isComplete ? "bg-emerald-500" : "bg-primary"}
                    />
                    <p className="text-muted-foreground mt-1 text-right text-xs">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>

                  {!isComplete && (
                    <div className="pt-2">
                      <Button
                        type="button"
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

      {/* Dialog สำหรับอัปเดตเงินออมเพิ่ม (แยกออกมานอก Loop เพื่อ Performance ที่ดีกว่า) */}
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
                <DollarSign className="text-muted-foreground absolute top-2.5 left-2.5 w-4 h-4" />
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
            <Button type="submit" className="w-full">
              อัปเดตยอด
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}