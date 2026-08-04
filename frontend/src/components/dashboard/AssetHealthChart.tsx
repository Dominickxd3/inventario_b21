"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { Skeleton } from "@mui/material";
import type { EChartsOption } from "echarts";

interface Props {
  data: { Estado: string; Cantidad: number }[];
}

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  loading: () => <Skeleton variant="rounded" height={260} />,
  ssr: false,
});

const COLORS: Record<string, string> = {
  Operativo: "#1B5E20",
  Mantenimiento: "#E65100",
  "En Mantenimiento": "#E65100",
  Averiado: "#B71C1C",
  Prestado: "#0D47A1",
  Baja: "#546E7A",
};

export default function AssetHealthChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((a, d) => a + d.Cantidad, 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      textStyle: { color: "#111827", fontSize: 13, fontWeight: 600 },
      formatter: (p: any) =>
        `<b>${p.name}</b><br/>${p.value} (${((p.value / total) * 100).toFixed(1)}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#6B7280", fontSize: 11, fontWeight: 600 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
    },
    graphic: ([
      { type: "text", left: "center", top: "38%", style: { text: String(total), fill: "#111827", fontSize: 26, fontWeight: "bold" } },
      { type: "text", left: "center", top: "55%", style: { text: "ACTIVOS", fill: "#9CA3AF", fontSize: 10, fontWeight: "bold" } },
    ] as any),
    series: [
      {
        type: "pie",
        radius: ["58%", "85%"],
        center: ["50%", "47%"],
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        data: data.map((d) => ({
          value: d.Cantidad,
          name: d.Estado,
          itemStyle: { color: COLORS[d.Estado] ?? "#9CA3AF" },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 260, width: "100%" }} opts={{ renderer: "svg" }} notMerge />;
}
