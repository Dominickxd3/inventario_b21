"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { Skeleton } from "@mui/material";
import type { EChartsOption } from "echarts";

interface Props {
  data: { tipo: string; cantidad: number }[];
}

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  loading: () => <Skeleton variant="rounded" height={240} />,
  ssr: false,
});

const COLORS = { Ingreso: "#1B5E20", Mantenimiento: "#E65100", Prestamo: "#0D47A1", Transferencia: "#C8A951", Baja: "#546E7A" };

export default function MovementSummaryChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      textStyle: { color: "#111827", fontSize: 13, fontWeight: 600 },
      formatter: (p: any) => `<b>${p[0].name}</b><br/>${p[0].value} movimientos`,
    },
    grid: { top: 10, right: 10, bottom: 30, left: 40 },
    xAxis: {
      type: "category",
      data: data.map((d) => d.tipo),
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisTick: { show: false },
      axisLabel: { color: "#9CA3AF", fontSize: 10, fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#F1F2F5", type: "dashed" } },
      axisLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: 500 },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => ({ value: d.cantidad, itemStyle: { color: (COLORS as any)[d.tipo] ?? "#8B0000", borderRadius: [5, 5, 0, 0] } })),
        barMaxWidth: 42,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240, width: "100%" }} opts={{ renderer: "svg" }} notMerge />;
}
