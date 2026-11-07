"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  // คอยเช็คสิทธิ์จาก localStorage ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, [pathname]);
  
  // เงื่อนไขการซ่อน Sidebar:
  // 1. ถ้าอยู่หน้าแรกสุด (/) หรือหน้า /tracker (หน้าคนขับ) ให้ซ่อน Sidebar ทันที
  const isAuthOrDriverPage = pathname === "/" || pathname === "/tracker";

  if (isAuthOrDriverPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      {/* แสดง Sidebar เฉพาะแอดมินที่อยู่ในโซน /admin เท่านั้น */}
      <Sidebar />
      
      {/* เนื้อหาหลัก */}
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        {children}
      </main>
    </>
  );
}