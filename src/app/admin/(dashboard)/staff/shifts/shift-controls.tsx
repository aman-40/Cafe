"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { startShift, endShift } from "./actions";

export function ShiftControls({ hasActiveShift }: { hasActiveShift: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    await startShift();
    setLoading(false);
  }

  async function handleEnd() {
    setLoading(true);
    await endShift();
    setLoading(false);
  }

  if (hasActiveShift) {
    return (
      <Button variant="destructive" onClick={handleEnd} disabled={loading}>
        <Square className="w-4 h-4 mr-2" fill="currentColor" />
        {loading ? "Processing..." : "End Shift"}
      </Button>
    );
  }

  return (
    <Button onClick={handleStart} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
      <Play className="w-4 h-4 mr-2" fill="currentColor" />
      {loading ? "Processing..." : "Start Shift"}
    </Button>
  );
}
