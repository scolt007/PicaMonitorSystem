import React from "react";
import { statusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { bg, text, label } = statusColor(status);

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
