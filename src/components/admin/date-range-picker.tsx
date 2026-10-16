"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DateRangeFilter } from "@/lib/analytics-utils";

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get("range") as DateRangeFilter) || "TODAY";

  function handleValueChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="w-[180px]">
      <select 
        value={currentFilter} 
        onChange={handleValueChange}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="TODAY">Today</option>
        <option value="YESTERDAY">Yesterday</option>
        <option value="LAST_7_DAYS">Last 7 Days</option>
        <option value="LAST_30_DAYS">Last 30 Days</option>
        <option value="THIS_MONTH">This Month</option>
        <option value="LAST_MONTH">Last Month</option>
      </select>
    </div>
  );
}
