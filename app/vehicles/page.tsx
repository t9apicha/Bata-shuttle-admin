"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Bus, MoreVertical, Edit, Trash2 } from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลรถจากฐานข้อมูล (คุณสามารถปรับ query ให้ตรงกับโครงสร้างจริงได้)
  useEffect(() => {
    async function fetchVehicles() {
      setIsLoading(true);
      // สมมติว่ามีการ join ตาราง routes เพื่อเอาชื่อเส้นทางมาแสดง
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, routes(name, color)"); 
      
      if (data) {
        setVehicles(data);
      }
      setIsLoading(false);
    }
    fetchVehicles();
  }, []);

  // ฟังก์ชันกรองข้อมูลตามคำค้นหา
  const filteredVehicles = vehicles.filter((v) =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      
      {/* ส่วนหัว (Header) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl hidden sm:block">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vehicles</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all shuttle vehicles</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
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
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ตารางข้อมูล (Table) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Assigned Route</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      กำลังโหลดข้อมูลยานพาหนะ...
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {vehicle.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {vehicle.code}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {vehicle.capacity} seats
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.routes?.name ? (
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: vehicle.routes?.color || '#3b82f6' }}
                          ></span>
                          {vehicle.routes.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                        vehicle.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                          : 'bg-amber-50 text-amber-600 border-amber-100/50'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* จุดสามจุด สำหรับตอนที่เมาส์ยังไม่ชี้ (Hover) */}
                      <button className="p-2 text-slate-300 group-hover:hidden">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลยานพาหนะในระบบ
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