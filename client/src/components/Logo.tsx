import React from "react";
import { AlertCircle, Activity, CheckCircle2 } from "lucide-react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative">
        <Activity className="w-6 h-6 text-white" />
        <CheckCircle2 className="w-3 h-3 text-green-300 absolute top-1 right-1" />
        <AlertCircle className="w-3 h-3 text-red-300 absolute bottom-1 left-1" />
      </div>
      <div className="ml-3 font-bold tracking-tight">
        <span className="text-lg text-white">PICA</span>
        <span className="text-lg text-primary ml-1">MONITOR</span>
      </div>
    </div>
  );
};

export default Logo;
