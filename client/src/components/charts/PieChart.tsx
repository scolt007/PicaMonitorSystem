import React, { useEffect, useRef } from "react";
import { Chart, registerables, ChartConfiguration } from "chart.js";

Chart.register(...registerables);

interface PieChartProps {
  data: number[];
  labels: string[];
  colors: string[];
}

const PieChart: React.FC<PieChartProps> = ({ data, labels, colors }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        const config: ChartConfiguration = {
          type: "pie",
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: colors,
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        };

        chartInstance.current = new Chart(ctx, config);
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, labels, colors]);

  return <canvas ref={chartRef} width="200" height="200" />;
};

export default PieChart;
