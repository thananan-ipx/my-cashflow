"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/types";
import { toast } from "sonner";
import { updateProfile } from "../services/user.action";

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: User | null;
  onSuccess: () => void;
}

export function EditUserDialog({ isOpen, onOpenChange, profile, onSuccess }: EditUserDialogProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsLoading(true);

    try {
      await updateProfile(profile.id, { name });
      toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
          <DialogDescription>
            แก้ไขรายละเอียดของ {profile?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editName">ชื่อ-นามสกุล</Label>
            <Input
              id="editName"
              placeholder="สมชาย ใจดี"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "กำลังดำเนินการ..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
