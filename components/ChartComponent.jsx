"use client"; // Next.js 13+ versiyalari uchun

import React from "react";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

// Chart.js komponentlarini ro‘yxatdan o‘tkazish
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const chartTypes = {
  line: Line,
  bar: Bar,
  pie: Pie,
  doughnut: Doughnut,
};

const ChartComponent = ({ type = "line", data, options }) => {
  const ChartTag = chartTypes[type] || Line; // Agar noto‘g‘ri type berilsa, default Line qo‘llanadi.

  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <ChartTag data={data} options={options} />
    </div>
  );
};

export default ChartComponent;
