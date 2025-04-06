import React from "react";
import { statusColor } from "@/lib/utils";
import { format } from "date-fns";

interface StatusBadgeProps {
  status: string;
  size?: 'xs' | 'sm' | 'default';
  dueDate?: string | Date; // Add optional due date parameter
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default', dueDate }) => {
  const { bg, text, label } = statusColor(status);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs leading-4',
    sm: 'px-2 py-0.5 text-xs leading-4',
    default: 'px-2 py-0.5 text-sm leading-5'
  };

  // Format the display text based on status and due date
  let displayText = label;
  if (status.toLowerCase() === 'complete' && dueDate) {
    // For completed items, add the date (April 11)
    try {
      const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      displayText = `${label} (${format(dateObj, 'dd MMM')})`;
    } catch (error) {
      // If date parsing fails, just show the status
      console.error("Date parsing failed:", error);
    }
  }

  return (
    <span className={`inline-flex font-semibold rounded-full ${sizeClasses[size]} ${bg} ${text}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;
