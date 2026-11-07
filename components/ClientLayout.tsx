"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ซ่อน Sidebar ในหน้า Login (ทั้ง / และ /login) และหน้าคนขับ (/tracker)
  const isAuthOrDriverPage = pathname === "/" || pathname === "/login" || pathname === "/tracker";

  if (isAuthOrDriverPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        {children}
      </main>
    </>
  );
}