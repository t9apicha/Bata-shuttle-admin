"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bus, Route, MapPin, Activity } from "lucide-react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export default function Dashboard() {
  const [stats, setStats] = useState({
    vehicles: 0,
    routes: 0,
    stops: 0,
    activeVehicles: 0,
  });
  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]); // เพิ่ม State เก็บเส้นทาง

  useEffect(() => {
    async function fetchDashboardData() {
      const { count: vehicleCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true });
      const { count: routeCount } = await supabase
        .from("routes")
        .select("*", { count: "exact", head: true });
      const { count: stopCount } = await supabase
        .from("stops")
        .select("*", { count: "exact", head: true });
      const { count: activeCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      setStats({
        vehicles: vehicleCount || 0,
        routes: routeCount || 0,
        stops: stopCount || 0,
        activeVehicles: activeCount || 0,
      });

      // ดึงข้อมูลจุดจอด
      const { data: stopsData } = await supabase
        .from("stops")
        .select("*")
        .eq("isActive", true);
      if (stopsData) setStops(stopsData);

      // ดึงข้อมูลสายรถ (เพื่อเอา GeoJSON ใน path_coordinates มาวาดเส้น)
      const { data: routesData } = await supabase
        .from("routes")
        .select("*")
        .eq("isActive", true);
      if (routesData) setRoutes(routesData);
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of the ShuttleTrack system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl text-white">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.vehicles}</p>
            <p className="text-xs font-medium text-gray-400">Total Vehicles</p>
            <span className="text-[10px] text-blue-600 font-semibold">{stats.activeVehicles} active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl text-white">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.routes}</p>
            <p className="text-xs font-medium text-gray-400">Total Routes</p>
            <span className="text-[10px] text-emerald-600 font-semibold">In system</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-xl text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.stops}</p>
            <p className="text-xs font-medium text-gray-400">Total Stops</p>
            <span className="text-[10px] text-amber-600 font-semibold">In system</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-500 p-3 rounded-xl text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.activeVehicles}</p>
            <p className="text-xs font-medium text-gray-400">Live Vehicles</p>
            <span className="text-[10px] text-purple-600 font-semibold">Running now</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-1">Stops & Live Locations</h2>
        <p className="text-xs text-gray-400 mb-4">Vehicle markers & stop locations on map</p>

        <div className="h-[450px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
          {/* ส่ง routes ลงไปให้ Map วาดเส้นทาง */}
          <MapComponent stops={stops} routes={routes} />
        </div>
      </div>
    </div>
  );
}