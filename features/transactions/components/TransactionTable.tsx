import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Trash2, Pencil, Loader2 } from "lucide-react"; // <-- เพิ่ม Pencil

import { Transaction } from "@/types";
import { OWNER_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number, type: "income" | "expense") => void;
}

export function TransactionTable({ transactions, isLoading, onEdit, onDelete }: TransactionTableProps) {
  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-25">วันที่</TableHead>
            <TableHead>หมวดหมู่</TableHead>
            <TableHead className="hidden md:table-cell w-30">เจ้าของ</TableHead>
            <TableHead className="hidden lg:table-cell">รายละเอียด</TableHead>
            <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
            <TableHead className="w-25 text-center">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin"/> กำลังโหลดข้อมูล...
                </div>
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                ไม่พบรายการในช่วงเวลาที่เลือก
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const ownerConf = OWNER_OPTIONS.find(o => o.value === tx.owner) || OWNER_OPTIONS[0];
              return (
                <TableRow key={`${tx.type}-${tx.id}`}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(tx.date), "d MMM yy", { locale: th })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category_color }} />
                      <span>{tx.category_name}</span>
                      {tx.sub_category && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                          {tx.sub_category}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap", ownerConf.color)}>
                      {ownerConf.label}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-50 truncate">
                    {tx.note || "-"}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-bold tabular-nums",
                    tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                        onClick={() => onEdit(tx)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                        onClick={() => onDelete(tx.id, tx.type)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}