import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PicaFilterButtonsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const PicaFilterButtons: React.FC<PicaFilterButtonsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const filters = [
    { id: "all", label: "All" },
    { id: "progress", label: "Progress" },
    { id: "complete", label: "Complete" },
    { id: "overdue", label: "Overdue" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          className={cn(
            "text-sm font-medium",
            activeFilter === filter.id
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default PicaFilterButtons;
