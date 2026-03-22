"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

import { Category } from "@/types";
import { fetchCategories, createCategory, deleteCategory } from "@/features/categories/services/category.action";
import { CategoryTable } from "@/features/categories/components/CategoryTable";

export default function CategoriesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#94a3b8");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      if (error instanceof Error) {
        toast.error("ดึงข้อมูลหมวดหมู่ล้มเหลว: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSaveCategory = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formName) return toast.error("กรุณากรอกชื่อหมวดหมู่");

    setIsSaving(true);
    try {
      const isDuplicate = categories.some(
        (c) => c.name.toLowerCase() === formName.toLowerCase() && c.type === formType
      );
      if (isDuplicate) throw new Error("มีหมวดหมู่นี้อยู่แล้ว");

      await createCategory(formType, formName, formColor);

      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setIsAddOpen(false);
      setFormName("");
      setFormColor("#94a3b8");
      loadCategories();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? (รายการเดิมที่ใช้หมวดหมู่นี้จะไม่ถูกลบ แต่กราฟอาจแสดงเป็น 'อื่นๆ')")) return;

    try {
      await deleteCategory(id);
      toast.success("ลบหมวดหมู่สำเร็จ");
      loadCategories();
    } catch (error) {
      if (error instanceof Error) toast.error("ลบข้อมูลล้มเหลว: " + error.message);
    }
  };

  const expensesCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการประเภทรายการ</h1>
          <p className="text-muted-foreground mt-2">เพิ่มหรือลบหมวดหมู่ของรายรับ-รายจ่าย เพื่อใช้ในระบบ</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> เพิ่มหมวดหมู่ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
              <DialogDescription>กำหนดชื่อและสีเพื่อใช้แสดงในกราฟ</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant={formType === "expense" ? "default" : "outline"} 
                    className={formType === "expense" ? "bg-rose-500 hover:bg-rose-600 flex-1" : "flex-1"}
                    onClick={() => setFormType("expense")}
                  >
                    รายจ่าย
                  </Button>
                  <Button 
                    type="button" 
                    variant={formType === "income" ? "default" : "outline"} 
                    className={formType === "income" ? "bg-emerald-500 hover:bg-emerald-600 flex-1" : "flex-1"}
                    onClick={() => setFormType("income")}
                  >
                    รายรับ
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ชื่อหมวดหมู่</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="เช่น ช้อปปิ้ง, ปันผล" required />
              </div>
              <div className="space-y-2">
                <Label>สีประจำหมวดหมู่</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="w-16 h-10 p-1 cursor-pointer" />
                  <Input type="text" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="flex-1 uppercase font-mono text-sm" />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึกหมวดหมู่"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="expense">หมวดหมู่รายจ่าย ({expensesCats.length})</TabsTrigger>
          <TabsTrigger value="income">หมวดหมู่รายรับ ({incomeCats.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <CategoryTable 
            categories={expensesCats} 
            isLoading={isLoading} 
            emptyMessage="ยังไม่มีหมวดหมู่รายจ่าย" 
            onDelete={handleDelete} 
          />
        </TabsContent>

        <TabsContent value="income">
          <CategoryTable 
            categories={incomeCats} 
            isLoading={isLoading} 
            emptyMessage="ยังไม่มีหมวดหมู่รายรับ" 
            onDelete={handleDelete} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}