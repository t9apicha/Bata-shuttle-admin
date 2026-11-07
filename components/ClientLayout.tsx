"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // เช็คว่าถ้าเป็นหน้า /login ให้ซ่อน Sidebar และไม่ต้องเว้นระยะขอบ
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      {/* แถบเมนูด้านซ้าย (แสดงเฉพาะหน้าอื่นที่ไม่ใช่หน้า Login) */}
      <Sidebar />
      
      {/* เนื้อหาหลัก */}
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        {children}
      </main>
    </>
  );
}