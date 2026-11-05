import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "ShuttleTrack RSU - Admin",
  description: "Shuttle Bus Admin Management Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex font-sans">
        {/* แถบเมนูด้านซ้าย */}
        <Sidebar />
        
        {/* เนื้อหาหลัก - เว้นระยะด้านบน pt-20 บนมือถือไว้ให้ปุ่ม 3 ขีด */}
        <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}