"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Route, Loader2 } from "lucide-react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // สร้าง State ไว้เก็บ ID ของเส้นทางที่กำลังถูกกดเปลี่ยนสถานะ (เพื่อโชว์ไอคอนโหลดหมุนๆ)
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 1. ฟังก์ชันดึงข้อมูลเส้นทางทั้งหมดจาก Supabase
  useEffect(() => {
    fetchRoutes();
  }, []);

  async function fetchRoutes() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("routes")
      .select("*")
      .order("id"); // เรียงตาม ID
    
    if (data) {
      setRoutes(data);
    }
    setIsLoading(false);
  }

  // 2. ฟังก์ชันสำหรับกดสลับสถานะ Active / Inactive
  const toggleRouteStatus = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id); // เปิดสถานะกำลังโหลดของแถวนี้
    const newStatus = !currentStatus;

    // อัปเดตข้อมูลไปยัง Supabase
    const { error } = await supabase
      .from("routes")
      .update({ isActive: newStatus })
      .eq("id", id);

    if (!error) {
      // อัปเดตข้อมูลบนหน้าเว็บให้ตรงกันทันทีโดยไม่ต้องรีเฟรชหน้า
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) =>
          route.id === id ? { ...route, isActive: newStatus } : route
        )
      );
    } else {
      console.error("Error updating status:", error);
      alert("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
    setUpdatingId(null); // ปิดสถานะกำลังโหลด
  };

  // ฟังก์ชันกรองข้อมูลตามคำค้นหา
  const filteredRoutes = routes.filter((r) =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      
      {/* ส่วนหัว (Header) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Routes</h1>
            <p className="text-slate-500 text-sm mt-1">Manage shuttle routes and paths</p>
          </div>
        </div>
        {/* เอาปุ่ม Add Route ออกตามที่รีเควสแล้วครับ */}
      </div>

      {/* ส่วนเนื้อหาหลัก (Main Content & Table) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        
        {/* แถบค้นหา (Search Bar) */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by route name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ตารางข้อมูล (Table) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-20">Color</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Route Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Status (คลิกเพื่อเปลี่ยน)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      กำลังโหลดข้อมูลเส้นทาง...
                    </div>
                  </td>
                </tr>
              ) : filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* คอลัมน์สี (Color) */}
                    <td className="px-6 py-4">
                      <div 
                        className="w-6 h-6 rounded-md shadow-sm border border-slate-200"
                        style={{ backgroundColor: route.color || '#cccccc' }}
                        title={route.color}
                      ></div>
                    </td>
                    
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {route.code}
                    </td>
                    
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {route.name}
                    </td>
                    
                    <td className="px-6 py-4 text-slate-500">
                      {route.description ? route.description : <span className="text-slate-300 italic">ไม่มีคำอธิบาย</span>}
                    </td>
                    
                    {/* คอลัมน์สถานะ (ปุ่มคลิกได้) */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleRouteStatus(route.id, route.isActive)}
                        disabled={updatingId === route.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all hover:scale-105 active:scale-95 ${
                          route.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer shadow-sm' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 cursor-pointer shadow-sm'
                        } ${updatingId === route.id ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {updatingId === route.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${route.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        )}
                        {route.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลเส้นทางในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}