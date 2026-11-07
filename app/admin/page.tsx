"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bus, Route, MapPin, Activity, LogOut } from "lucide-react";
import dynamic from "next/dynamic";

// โหลดคอมโพเนนต์แผนที่แบบปิด SSR (Server-Side Rendering) เพราะใช้ไลบรารี Leaflet
const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export default function Dashboard() {
  const router = useRouter();
  
  // สถานะตรวจสอบสิทธิ์ (ป้องกันอาการหน้าเว็บกระพริบหรือเด้งหลุดเอง)
  const [isAuthorized, setIsAuthorized] = useState(false);

  // States สำหรับเก็บข้อมูลสถิติและพิกัดต่างๆ
  const [stats, setStats] = useState({ vehicles: 0, routes: 0, stops: 0, activeVehicles: 0 });
  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);

  // 1. ระบบตรวจสอบสิทธิ์ (Auth Guard): เช็คว่าถ้าไม่ใช่แอดมิน ให้ดีดกลับหน้าแรกสุด
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      router.push("/");
    } else {
      setIsAuthorized(true); // อนุญาตให้แสดงหน้าเว็บเมื่อตรวจสอบว่าเป็นแอดมินจริง
    }
  }, [router]);

  // 2. ดึงข้อมูลภาพรวมและตั้งค่า Real-time ดักฟังพิกัดรถจาก Supabase
  useEffect(() => {
    if (!isAuthorized) return; // ทำงานต่อเมื่อผ่านการตรวจสอบสิทธิ์แล้วเท่านั้น

    async function fetchDashboardData() {
      // ดึงจำนวนนับของรถ, เส้นทาง, ป้ายจอด และรถที่กำลังวิ่งอยู่
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

      // ดึงข้อมูลป้ายรถเมล์และเส้นทางที่เปิดใช้งาน
      const { data: stopsData } = await supabase.from("stops").select("*").eq("isActive", true);
      if (stopsData) setStops(stopsData);

      const { data: routesData } = await supabase.from("routes").select("*").eq("isActive", true);
      if (routesData) setRoutes(routesData);

      // ดึงรายการรถทั้งหมดเพื่อแสดงตำแหน่งเริ่มต้นบนแผนที่
      const { data: vehiclesData } = await supabase.from("vehicles").select("*");
      if (vehiclesData) setVehiclesList(vehiclesData);
    }

    fetchDashboardData();

    // ระบบ Real-time: อัปเดตตำแหน่งพิกัดรถบนแผนแบบเรียลไทม์เมื่อมีการขยับ
    const channel = supabase
      .channel('realtime-vehicles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          setVehiclesList((prev) => 
            prev.map((v) => v.id === payload.new.id ? { ...v, ...payload.new } : v)
          );
        }
      )
      .subscribe();

    // ล้างช่องสัญญาณ Real-time เมื่อผู้ใช้ออกจากหน้าเว็บ
    return () => {
      supabase.removeChannel(channel); 
    };
  }, [isAuthorized]);

  // 3. ฟังก์ชันจัดการการออกจากระบบ: ล้างค่าใน LocalStorage และพาเด้งกลับหน้าแรกสุด
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // ถ้าระหว่างเช็คสิทธิ์ยังไม่เสร็จ ให้แสดงหน้าต่างโหลดสั้นๆ เพื่อกันหน้าจอพัง
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium">
        กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ส่วนหัวหน้า Dashboard และปุ่มออกจากระบบ */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of the ShuttleTrack system</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm border border-red-100 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>

      {/* แผงแสดงสถิติตัวเลขภาพรวม (Total Vehicles, Routes, Stops, Live Vehicles) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* การ์ดแสดงจำนวนรถทั้งหมด */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-xl text-white"><Bus className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.vehicles}</p>
            <p className="text-xs font-medium text-gray-400">Total Vehicles</p>
            <span className="text-[10px] text-blue-600 font-semibold">{stats.activeVehicles} active</span>
          </div>
        </div>

        {/* การ์ดแสดงจำนวนเส้นทางทั้งหมด */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl text-white"><Route className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.routes}</p>
            <p className="text-xs font-medium text-gray-400">Total Routes</p>
            <span className="text-[10px] text-emerald-600 font-semibold">In system</span>
          </div>
        </div>

        {/* การ์ดแสดงจำนวนป้ายจอดทั้งหมด */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-xl text-white"><MapPin className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.stops}</p>
            <p className="text-xs font-medium text-gray-400">Total Stops</p>
            <span className="text-[10px] text-amber-600 font-semibold">In system</span>
          </div>
        </div>

        {/* การ์ดแสดงจำนวนรถที่กำลังวิ่งอยู่แบบ Live */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-500 p-3 rounded-xl text-white"><Activity className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.activeVehicles}</p>
            <p className="text-xs font-medium text-gray-400">Live Vehicles</p>
            <span className="text-[10px] text-purple-600 font-semibold">Running now</span>
          </div>
        </div>
      </div>

      {/* ส่วนแสดงแผนที่และการเคลื่อนที่ของรถแบบเรียลไทม์ */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-1">Stops & Live Locations</h2>
        <p className="text-xs text-gray-400 mb-4">Vehicle markers & stop locations on map</p>

        <div className="h-[450px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
          <MapComponent stops={stops} routes={routes} vehicles={vehiclesList} />
        </div>
      </div>
    </div>
  );
}