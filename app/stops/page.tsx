"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, MapPin, Loader2 } from "lucide-react";

export default function StopsPage() {
  const [stops, setStops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // ฟังก์ชันดึงข้อมูลจุดจอดทั้งหมดจาก Supabase
  useEffect(() => {
    fetchStops();
  }, []);

  async function fetchStops() {
    setIsLoading(true);
    // ดึงฟิลด์ให้ตรงกับชื่อคอลัมน์ใน Supabase ของคุณ
    const { data, error } = await supabase
      .from("stops")
      .select("id, code, name, description, latitude, longitude, isActive")
      .order("code"); // เรียงตามรหัสป้าย เช่น P01, P02
    
    if (data) {
      setStops(data);
    } else if (error) {
      console.error("Error fetching stops:", error);
    }
    setIsLoading(false);
  }

  // ฟังก์ชันสำหรับกดสลับสถานะ Active / Inactive
  const toggleStopStatus = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;

    // อัปเดตข้อมูลไปยังคอลัมน์ isActive ในตาราง stops ของ Supabase
    const { error } = await supabase
      .from("stops")
      .update({ isActive: newStatus })
      .eq("id", id);

    if (!error) {
      // อัปเดตข้อมูลบนหน้าเว็บให้ตรงกันทันที
      setStops((prevStops) =>
        prevStops.map((stop) =>
          stop.id === id ? { ...stop, isActive: newStatus } : stop
        )
      );
    } else {
      console.error("Error updating status:", error);
      alert("ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
    setUpdatingId(null);
  };

  // ฟังก์ชันกรองข้อมูลตามคำค้นหา (ค้นหาจากรหัสป้าย หรือชื่อป้าย)
  const filteredStops = stops.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      
      {/* ส่วนหัว (Header) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl hidden sm:block">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stops</h1>
            <p className="text-slate-500 text-sm mt-1">Manage bus stops & GPS locations</p>
          </div>
        </div>
        {/* เอาปุ่ม Add Stop ออกเรียบร้อยครับ */}
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
              placeholder="Search by stop name or code (e.g., P01)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ตารางข้อมูล (Table) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Stop Name</th>
                <th className="px-6 py-4 text-right">Latitude</th>
                <th className="px-6 py-4 text-right">Longitude</th>
                <th className="px-6 py-4 text-center">Status (คลิกเพื่อเปลี่ยน)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      กำลังโหลดข้อมูลจุดจอด...
                    </div>
                  </td>
                </tr>
              ) : filteredStops.length > 0 ? (
                filteredStops.map((stop) => (
                  <tr key={stop.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {stop.code}
                    </td>
                    
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {stop.name}
                    </td>
                    
                    <td className="px-6 py-4 text-right font-mono text-slate-500 text-xs">
                      {stop.latitude?.toFixed(6) || '-'}
                    </td>
                    
                    <td className="px-6 py-4 text-right font-mono text-slate-500 text-xs">
                      {stop.longitude?.toFixed(6) || '-'}
                    </td>
                    
                    {/* คอลัมน์สถานะ (ปุ่มคลิกได้ สไตล์เดียวกับหน้า Routes แต่เป็นโทนสีของจุดจอด) */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStopStatus(stop.id, stop.isActive)}
                        disabled={updatingId === stop.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all hover:scale-105 active:scale-95 ${
                          stop.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer shadow-sm' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 cursor-pointer shadow-sm'
                        } ${updatingId === stop.id ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {updatingId === stop.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${stop.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        )}
                        {stop.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลจุดจอดรถในระบบ
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