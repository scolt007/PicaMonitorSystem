import React from "react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="w-10 h-10 bg-primary flex items-center justify-center">
        <span className="text-xs font-semibold text-white">LOGO</span>
      </div>
      <div className="ml-3 text-lg font-semibold">COMPANY NAME</div>
    </div>
  );
};

export default Logo;
