import React from 'react';

const Footer = () => {
  return (
    <footer className="py-6 px-4 mt-auto border-t border-border/50 bg-transparent relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-1.5">
        <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] font-medium text-center flex items-center justify-center gap-1.5">
          Made with <span className="text-[#EF4444] text-[14px] leading-none">❤</span> for Indian Photographers
        </p>
        <p className="text-[#9CA3AF] text-[10px] sm:text-[11px] text-center">
          Pixora Studio © 2026 Ver. 1.2.0
        </p>
      </div>
    </footer>
  );
};

export default Footer;