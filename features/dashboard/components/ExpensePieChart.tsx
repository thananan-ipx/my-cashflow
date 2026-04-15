import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { cn } from "@/lib/utils";

interface ExpensePieChartProps {
  data: { name: string; value: number; color: string }[];
  isLoading: boolean;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export function ExpensePieChart({ data, isLoading }: ExpensePieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Expense Distribution</h3>
          <p className="text-sm text-muted-foreground">Categorized spending for this period</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="h-64">
          {data.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-muted/20">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  stroke="none"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                            <span className="text-xs font-bold">{payload[0].name}</span>
                          </div>
                          <p className="mt-1 text-xs font-medium tabular-nums text-muted-foreground">
                            ฿{Number(payload[0].value).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {data.map((item, index) => (
            <div 
              key={item.name}
              className={cn(
                "group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50",
                activeIndex === index ? "bg-muted/50" : ""
              )}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums italic font-mono">
                  {((item.value / total) * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  ฿{item.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
