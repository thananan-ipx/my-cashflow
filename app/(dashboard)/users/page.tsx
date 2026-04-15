"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types";
import { fetchProfiles, getCurrentProfile } from "@/features/users/services/user.action";
import { UserTable } from "@/features/users/components/UserTable";
import { AddUserDialog } from "@/features/users/components/AddUserDialog";
import { EditUserDialog } from "@/features/users/components/EditUserDialog";
import { ChangePasswordDialog } from "@/features/users/components/ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentProfile, setCurrentProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<User | null>(null);
  const [passwordResetProfile, setPasswordResetProfile] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers, me] = await Promise.all([
        fetchProfiles(),
        getCurrentProfile()
      ]);
      setUsers(allUsers || []);
      setCurrentProfile(me);
    } catch {
      toast.error("ดึงข้อมูลผู้ใช้ล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(p => 
      p.name?.toLowerCase().includes(query) || 
      p.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground mt-2">
            จัดการบัญชีผู้ใช้งานที่สามารถเข้าถึงระบบ
          </p>
        </div>

        <Button className="flex items-center gap-2" onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="w-4 h-4" /> สร้างผู้ใช้งานใหม่
        </Button>
      </div>

      <AddUserDialog 
        isOpen={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={loadData} 
      />

      <EditUserDialog 
        isOpen={!!editingProfile} 
        onOpenChange={(open) => !open && setEditingProfile(null)} 
        profile={editingProfile} 
        onSuccess={loadData} 
      />

      {passwordResetProfile && (
        <ChangePasswordDialog
          isOpen={!!passwordResetProfile}
          onOpenChange={(open) => !open && setPasswordResetProfile(null)}
          user={{ id: passwordResetProfile.id, name: passwordResetProfile.name || "ไม่ระบุชื่อ" }}
          onSuccess={loadData}
        />
      )}

      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ค้นหาชื่อ หรืออีเมล..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            แสดง {filteredUsers.length} จาก {users.length} รายการ
          </div>
        </div>

        <UserTable 
          profiles={filteredUsers} 
          currentUserId={currentProfile?.id} 
          isLoading={isLoading} 
          onEdit={setEditingProfile}
          onChangePassword={setPasswordResetProfile}
        />
      </div>
    </div>
  );
}
