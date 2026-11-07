"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // เช็คว่าถ้าเป็นหน้าแรกสุด (/) หรือ /login ให้ซ่อน Sidebar ทันที
  const isAuthPage = pathname === "/" || pathname === "/login";

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      {/* แถบเมนูด้านซ้าย (แสดงเฉพาะตอนเข้าสู่ระบบแล้ว เช่น หน้าแอดมิน) */}
      <Sidebar />
      
      {/* เนื้อหาหลัก */}
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        {children}
      </main>
    </>
  );
}