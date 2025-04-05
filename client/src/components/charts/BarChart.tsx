import React, { useEffect, useRef } from "react";
import { Chart, registerables, ChartConfiguration } from "chart.js";

Chart.register(...registerables);

interface BarChartProps {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
  maxY?: number;
}

const BarChart: React.FC<BarChartProps> = ({ labels, datasets, maxY = 5 }) => {
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
          type: "bar",
          data: {
            labels,
            datasets: datasets.map(dataset => ({
              ...dataset,
              barPercentage: 0.7,
            })),
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: maxY,
              },
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
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
  }, [labels, datasets, maxY]);

  return <canvas ref={chartRef} height="200" />;
};

export default BarChart;
