"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const STATUS_COLORS: Record<string, string> = {
  Operativo: "#1B5E20",
  Mantenimiento: "#E65100",
  "En Mantenimiento": "#E65100",
  Averiado: "#B71C1C",
  Prestado: "#0D47A1",
  Baja: "#546E7A",
};

interface Props {
  data: { Estado: string; Cantidad: number }[];
  height?: number;
}

export default function AssetStatusChart({ data, height = 240 }: Props) {
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
        `<b>${p.name}</b><br/>${p.value} activos (${((p.value / total) * 100).toFixed(1)}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#6B7280", fontSize: 11, fontWeight: 600 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
    },
    graphic: ([
      {
        type: "text",
        left: "center",
        top: "40%",
        style: {
          text: String(total),
          fill: "#111827",
          fontSize: 28,
          fontWeight: "bold",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
      {
        type: "text",
        left: "center",
        top: "57%",
        style: {
          text: "ACTIVOS",
          fill: "#9CA3AF",
          fontSize: 10,
          fontWeight: "bold",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
    ] as any),
    series: [
      {
        type: "pie",
        radius: ["55%", "82%"],
        center: ["50%", "47%"],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        emphasis: { scaleSize: 6 },
        data: data.map((d) => ({
          value: d.Cantidad,
          name: d.Estado,
          itemStyle: {
            color: STATUS_COLORS[d.Estado] ?? "#9CA3AF",
          },
        })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "svg" }}
      notMerge
    />
  );
}
