"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface Props {
  data: { Anio: number; Mes: number; Cantidad: number }[];
  height?: number;
}

export default function MaintenanceCostChart({ data, height = 240 }: Props) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.Anio - b.Anio || a.Mes - b.Mes);
  const labels = sorted.map((d) => `${String(d.Mes).padStart(2, "0")}/${d.Anio}`);
  const values = sorted.map((d) => d.Cantidad);

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      textStyle: { color: "#111827", fontSize: 13, fontWeight: 600 },
      formatter: (p: any) => `<b>${p[0].name}</b><br/>Ordenes: ${p[0].value}`,
    },
    grid: { top: 10, right: 10, bottom: 30, left: 40 },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisTick: { show: false },
      axisLabel: { color: "#9CA3AF", fontSize: 11, fontWeight: 500 },
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
        data: values,
        itemStyle: { color: "#C8A951", borderRadius: [5, 5, 0, 0] },
        barMaxWidth: 36,
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height, width: "100%" }} opts={{ renderer: "svg" }} notMerge />
  );
}
