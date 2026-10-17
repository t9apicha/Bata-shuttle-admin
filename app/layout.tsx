import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LayoutDashboard, Bus, Route, MapPin } from "lucide-react";

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
        {/* Sidebar ด้านซ้าย */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 px-3 py-4 mb-6">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-base">ShuttleTrack RSU</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </Link>
              <Link href="/vehicles" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Bus className="w-5 h-5" /> Vehicles
              </Link>
              <Link href="/routes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Route className="w-5 h-5" /> Routes
              </Link>
              <Link href="/stops" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <MapPin className="w-5 h-5" /> Stops
              </Link>
            </nav>
          </div>

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 px-3">
            Logged in as: <span className="font-semibold text-gray-600">Admin</span>
          </div>
        </aside>

        {/* ส่วนแสดงผลเนื้อหาแต่ละหน้า */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}