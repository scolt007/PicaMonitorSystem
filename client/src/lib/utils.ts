import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, shortFormat: boolean = false): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, shortFormat ? "dd MMM" : "dd MMM yyyy");
}

export function statusColor(status: string): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status.toLowerCase()) {
    case "progress":
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Progress",
      };
    case "complete":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Complete",
      };
    case "overdue":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Overdue",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: status,
      };
  }
}

export function generatePicaId(projectCode: string): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear().toString().slice(2);
  
  // Get count of existing PICAs for this project and month
  // This is a placeholder function - in a real app, you'd query the API
  const count = Math.floor(Math.random() * 10) + 1;
  
  return `${month}${year}${projectCode}${count.toString().padStart(2, '0')}`;
}
