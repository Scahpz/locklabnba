import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';
import MiniParlayBar from './MiniParlayBar';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 mobile-scroll-pad md:pb-6 pt-14 md:pt-0",
        collapsed ? "md:ml-16" : "md:ml-60"
      )}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav */}
      <MobileNav />

      {/* Mini Parlay Bar */}
      <MiniParlayBar />
    </div>
  );
}