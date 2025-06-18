import { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MainLayout>
      <div className="flex min-h-screen flex-col">
        <div className="container flex-1">
          {children}
        </div>
      </div>
    </MainLayout>
  );
}
