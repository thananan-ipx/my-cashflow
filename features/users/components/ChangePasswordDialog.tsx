import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserPassword } from "@/features/users/services/user.action";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string };
  onSuccess: () => void;
}

export function ChangePasswordDialog({ isOpen, onOpenChange, user, onSuccess }: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserPassword(user.id, password);
      toast.success(`เปลี่ยนรหัสผ่านสำหรับ ${user.name} สำเร็จ`);
      onOpenChange(false);
      setPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนรหัสผ่าน: {user.name}</DialogTitle>
          <DialogDescription>ตั้งค่ารหัสผ่านใหม่ให้กับผู้ใช้งานนี้</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>รหัสผ่านใหม่</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ยืนยันรหัสผ่าน</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "ยืนยัน"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
