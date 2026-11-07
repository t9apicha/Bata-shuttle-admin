"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Route, Loader2 } from "lucide-react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  async function fetchRoutes() {
    setIsLoading(true);
    // ดึงข้อมูลระบุคอลัมน์ให้ชัดเจนตามฐานข้อมูลของคุณ
    const { data, error } = await supabase
      .from("routes")
      .select("id, code, name, description, color, isActive")
      .order("id");
    
    if (data) {
      setRoutes(data);
    } else if (error) {
      console.error("Error fetching routes:", error);
    }
    setIsLoading(false);
  }

  const toggleRouteStatus = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;

    // อัปเดตคอลัมน์ isActive ในฐานข้อมูล Supabase
    const { error } = await supabase
      .from("routes")
      .update({ isActive: newStatus })
      .eq("id", id);

    if (!error) {
      // อัปเดต State บนหน้าเว็บ
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) =>
          route.id === id ? { ...route, isActive: newStatus } : route
        )
      );
    } else {
      console.error("Error updating status:", error);
      alert("ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
    setUpdatingId(null);
  };

  const filteredRoutes = routes.filter((r) =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Routes</h1>
            <p className="text-slate-500 text-sm mt-1">Manage shuttle routes and paths</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        
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
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-20">Color</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Route Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="w-6 h-6 rounded-md shadow-sm border border-slate-200"
                        style={{ backgroundColor: route.color || '#cccccc' }}
                        title={route.color}
                      ></div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{route.code}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{route.name}</td>
                    <td className="px-6 py-4 text-slate-500">{route.description || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleRouteStatus(route.id, route.isActive)}
                        disabled={updatingId === route.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all ${
                          route.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        } ${updatingId === route.id ? 'opacity-50 cursor-wait' : ''}`}
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
                    ไม่พบข้อมูล
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