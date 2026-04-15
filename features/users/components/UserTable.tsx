import { User as UserType } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, User, UserX, Edit } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { deleteProfile } from "../services/user.action";

interface UserTableProps {
  profiles: UserType[];
  currentUserId: string | undefined;
  isLoading: boolean;
  onEdit: (profile: UserType) => void;
}

export function UserTable({ profiles, currentUserId, isLoading, onEdit }: UserTableProps) {
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้ออกจากระบบ?")) return;
    try {
      await deleteProfile(userId);
      toast.success("ลบผู้ใช้สำเร็จ");
    } catch (error) {
      toast.error("ลบผู้ใช้ล้มเหลว");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้...</div>;
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ผู้ใช้งาน</TableHead>
            <TableHead>วันที่เข้าร่วม</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                ไม่พบข้อมูลผู้ใช้
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={""} />
                      <AvatarFallback>
                        {profile.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {profile.name || "ไม่ระบุชื่อ"}
                        {profile.id === currentUserId && (
                          <span className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">คุณ</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(profile.created_at), "d MMM yyyy", { locale: th })}
                </TableCell>
                <TableCell>
                  {profile.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(profile)}>
                          <Edit className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteUser(profile.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" /> ลบผู้ใช้
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
