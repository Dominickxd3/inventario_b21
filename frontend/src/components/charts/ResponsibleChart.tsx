"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface Props {
  data: { responsable: string; cantidad: number }[];
  height?: number;
}

export default function ResponsibleChart({ data, height = 260 }: Props) {
  if (!data || data.length === 0) return null;

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      textStyle: { color: "#111827", fontSize: 13, fontWeight: 600 },
      formatter: (p: any) => `<b>${p[0].name}</b><br/>${p[0].value} activos asignados`,
    },
    grid: { top: 5, right: 20, bottom: 5, left: 20, containLabel: true },
    xAxis: {
      type: "value",
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#F1F2F5", type: "dashed" } },
      axisLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: 500 },
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.responsable),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#374151", fontSize: 12, fontWeight: 600 },
      inverse: true,
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => ({ value: d.cantidad, itemStyle: { color: "#8B0000", borderRadius: [0, 6, 6, 0] } })),
        barMaxWidth: 22,
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height, width: "100%" }} opts={{ renderer: "svg" }} notMerge />
  );
}
