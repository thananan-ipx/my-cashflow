import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ExpensePieChartProps {
  data: { name: string; value: number; color: string }[];
  isLoading: boolean;
}

export function ExpensePieChart({ data, isLoading }: ExpensePieChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>สัดส่วนรายจ่ายตามช่วงเวลา</CardTitle></CardHeader>
      <CardContent className="h-75 flex items-center justify-center">
        {data.length === 0 && !isLoading ? (
          <p className="text-muted-foreground text-sm">ไม่มีข้อมูลรายจ่ายในช่วงเวลานี้</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}