import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendBarChartProps {
  data: { month: string; income: number; expense: number }[];
  isLoading: boolean;
}

export function TrendBarChart({ data, isLoading }: TrendBarChartProps) {
  const isDataEmpty = data.every(t => t.income === 0 && t.expense === 0);

  return (
    <Card>
      <CardHeader><CardTitle>รายรับ vs รายจ่าย (6 เดือนย้อนหลัง)</CardTitle></CardHeader>
      <CardContent className="h-75">
        {isDataEmpty && !isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูลเพียงพอ</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value / 1000}k`} />
              <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} cursor={{ fill: 'transparent' }} />
              <Legend />
              <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}