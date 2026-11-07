"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bus, Route, MapPin, Activity, LogOut } from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-sm rounded-2xl border border-slate-100">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      กำลังโหลดแผนที่ระบบขนส่ง...
    </div>
  ),
});

export default function Dashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState({ vehicles: 0, routes: 0, stops: 0, activeVehicles: 0 });
  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      router.push("/");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    async function fetchDashboardData() {
      const { count: vehicleCount } = await supabase.from("vehicles").select("*", { count: "exact", head: true });
      const { count: routeCount } = await supabase.from("routes").select("*", { count: "exact", head: true });
      const { count: stopCount } = await supabase.from("stops").select("*", { count: "exact", head: true });
      const { count: activeCount } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");

      setStats({
        vehicles: vehicleCount || 0,
        routes: routeCount || 0,
        stops: stopCount || 0,
        activeVehicles: activeCount || 0,
      });

      const { data: stopsData } = await supabase.from("stops").select("*").eq("isActive", true);
      if (stopsData) setStops(stopsData);
      const { data: routesData } = await supabase.from("routes").select("*").eq("isActive", true);
      if (routesData) setRoutes(routesData);
      const { data: vehiclesData } = await supabase.from("vehicles").select("*");
      if (vehiclesData) setVehiclesList(vehiclesData);
    }
    fetchDashboardData();

    const channel = supabase
      .channel('realtime-vehicles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles' }, (payload) => {
          setVehiclesList((prev) => prev.map((v) => v.id === payload.new.id ? { ...v, ...payload.new } : v));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthorized]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">ติดตามสถานะรถรับส่งและเส้นทางทั้งหมดในระบบ ShuttleTrack RSU</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all duration-200 font-semibold text-sm border border-rose-100/50 hover:shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Vehicles */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-blue-50/50 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">ยานพาหนะทั้งหมด</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.vehicles}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Bus className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-medium">{stats.activeVehicles} คัน พร้อมใช้งาน</span>
          </div>
        </div>

        {/* Card 2: Total Routes */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] border border-emerald-50/50 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">เส้นทางวิ่งรถ</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.routes}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Route className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">เปิดให้บริการในระบบ</span>
          </div>
        </div>

        {/* Card 3: Total Stops */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] border border-amber-50/50 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">จุดจอดรับ-ส่ง</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.stops}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium">กระจายตามจุดต่างๆ</span>
          </div>
        </div>

        {/* Card 4: Live Vehicles */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(139,92,246,0.1)] border border-purple-50/50 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">กำลังวิ่งให้บริการ</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.activeVehicles}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-purple-600 font-semibold tracking-wide">Real-time ทั่ววิทยาเขต</span>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Live Map Tracking
            </h2>
            <p className="text-slate-500 text-sm mt-1">แสดงตำแหน่งรถบัสที่กำลังวิ่งและจุดจอดต่างๆ บนแผนที่จริง</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> รถบัส</div>
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> จุดจอด</div>
          </div>
        </div>

        <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner relative z-0">
          <MapComponent stops={stops} routes={routes} vehicles={vehiclesList} />
        </div>
      </div>
      
    </div>
  );
}