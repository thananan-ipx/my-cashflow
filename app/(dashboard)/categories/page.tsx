"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Tags, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Category = {
  id: number;
  type: "income" | "expense";
  name: string;
  color: string;
};

export default function CategoriesPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#94a3b8");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("ดึงข้อมูลหมวดหมู่ล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return toast.error("กรุณากรอกชื่อหมวดหมู่");

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

      // เช็คชื่อซ้ำ
      const isDuplicate = categories.some(
        (c) => c.name.toLowerCase() === formName.toLowerCase() && c.type === formType
      );
      if (isDuplicate) throw new Error("มีหมวดหมู่นี้อยู่แล้ว");

      const { error } = await supabase.from("transaction_categories").insert({
        user_id: user.id,
        type: formType,
        name: formName,
        color: formColor,
      });

      if (error) throw error;
      
      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setIsAddOpen(false);
      setFormName("");
      setFormColor("#94a3b8");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? (รายการเดิมที่ใช้หมวดหมู่นี้จะไม่ถูกลบ แต่กราฟอาจแสดงเป็น 'อื่นๆ')")) return;

    try {
      const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
      if (error) throw error;

      toast.success("ลบหมวดหมู่สำเร็จ");
      fetchCategories();
    } catch (error: any) {
      toast.error("ลบข้อมูลล้มเหลว: " + error.message);
    }
  };

  const expensesCats = categories.filter(c => c.type === "expense");
  const incomeCats = categories.filter(c => c.type === "income");

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
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">สี</TableHead>
                  <TableHead>ชื่อหมวดหมู่</TableHead>
                  <TableHead className="w-[100px] text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground"/></TableCell></TableRow>
                ) : expensesCats.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">ยังไม่มีหมวดหมู่รายจ่าย</TableCell></TableRow>
                ) : (
                  expensesCats.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell><div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: cat.color }} /></TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">สี</TableHead>
                  <TableHead>ชื่อหมวดหมู่</TableHead>
                  <TableHead className="w-[100px] text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground"/></TableCell></TableRow>
                ) : incomeCats.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">ยังไม่มีหมวดหมู่รายรับ</TableCell></TableRow>
                ) : (
                  incomeCats.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell><div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: cat.color }} /></TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}