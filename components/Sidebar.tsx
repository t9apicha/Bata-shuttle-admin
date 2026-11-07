"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Bus, Route, MapPin, Menu, X, Navigation } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ปุ่ม Hamburger (3 ขีด) แสดงเฉพาะบนจอมือถือ - ตั้งค่า z-[60] ให้ลอยอยู่เหนือทุกสิ่ง */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* ฉากหลังสีดำจางๆ เวลาเปิดเมนู */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ตัวแถบเมนูด้านซ้าย */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-4 flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-6 pt-12 md:pt-0">
            <div className="flex items-center gap-3 px-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-base">ShuttleTrack</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
            {/* ปุ่มกากบาทปิดเมนู */}
            <button 
              onClick={() => setIsOpen(false)} 
              className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {/* 🔥 แก้ไขตรงนี้: เปลี่ยนจาก href="/" เป็น href="/admin" เพื่อให้กดแล้วกลับหน้า Dashboard แอดมินจริง ๆ */}
            <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            
            <Link href="/vehicles" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Bus className="w-5 h-5" /> Vehicles
            </Link>
            <Link href="/routes" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Route className="w-5 h-5" /> Routes
            </Link>
            <Link href="/stops" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MapPin className="w-5 h-5" /> Stops
            </Link>
            
            {/* ปุ่มไปหน้ากดส่ง GPS */}
            <Link href="/tracker" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
              <Navigation className="w-5 h-5" /> GPS Tracker (คนขับ)
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 px-3">
          Logged in as: <span className="font-semibold text-gray-600">Admin</span>
        </div>
      </aside>
    </>
  );
}