import React from "react";
import { statusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: 'xs' | 'sm' | 'default';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default' }) => {
  const { bg, text, label } = statusColor(status);

  const sizeClasses = {
    xs: 'px-1 py-0 text-[8px] leading-3',
    sm: 'px-1.5 py-0.5 text-[10px] leading-3',
    default: 'px-2 py-0.5 text-xs leading-5'
  };

  return (
    <span className={`inline-flex font-semibold rounded-full ${sizeClasses[size]} ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
