"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // 1. นำเข้า useRouter
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";

export default function TrackerPage() {
  const router = useRouter(); // 2. เรียกใช้งาน router
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  // ข้อมูลคนขับ
  const [driverName, setDriverName] = useState<string>("");
  const [logId, setLogId] = useState<number | null>(null); // เก็บ ID ของประวัติการขับรอบนี้

  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState({ lat: 13.9649, lng: 100.5872 }); 
  const [watchId, setWatchId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("รอการเริ่มต้น..."); 

  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  const staticLayersRef = useRef<any>(null); 
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const LRef = useRef<any>(null); 

  // 🔥 3. ระบบ Auth Guard & ดึงชื่อคนขับ
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/"); // ถ้าไม่มีสิทธิ์ เด้งกลับหน้า Login
    } else {
      const name = localStorage.getItem("driverName");
      if (name) setDriverName(name);
    }
  }, [router]);

  // 1. ดึงข้อมูลทั้งหมด
  useEffect(() => {
    async function fetchMapData() {
      const [stopsRes, routesRes, vehiclesRes] = await Promise.all([
        supabase.from("stops").select("*").eq("isActive", true),
        supabase.from("routes").select("*").eq("isActive", true),
        supabase.from("vehicles").select("*").order("id", { ascending: true })
      ]);
      
      if (stopsRes.data) setStops(stopsRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    }
    fetchMapData();
  }, []);

  // 2. สร้างแผนที่หลัก
  useEffect(() => {
    if (typeof window !== "undefined" && mapContainer.current && !mapRef.current) {
      import("leaflet").then((L) => {
        LRef.current = L; 
        const map = L.map(mapContainer.current!).setView([coords.lat, coords.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        staticLayersRef.current = L.layerGroup().addTo(map);

        const busIcon = L.divIcon({
          className: "custom-bus-icon",
          html: `<div style="font-size: 24px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transition: transform 1s linear;">🚌</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);

        mapRef.current = map;
        markerRef.current = marker;
      });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        staticLayersRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedVehicle && mapRef.current) {
      setTimeout(() => { mapRef.current.invalidateSize(); }, 300);
    }
  }, [selectedVehicle]);

  // 3. วาดเส้นทางและป้ายจอดรถ
  useEffect(() => {
    if (!mapRef.current || !LRef.current || !staticLayersRef.current) return;
    const L = LRef.current;
    const staticGroup = staticLayersRef.current;
    
    staticGroup.clearLayers();

    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        if (route.path_coordinates) {
           let geoData = route.path_coordinates;
           if(typeof geoData === 'string'){
              try { geoData = JSON.parse(geoData); } catch(e){}
           }

          L.geoJSON(geoData, {
            style: function () { return { color: route.color || '#4B0082', weight: 5, opacity: 0.8 }; },
            pointToLayer: function (feature: any, latlng: any) {
              return L.circleMarker(latlng, { radius: 6, fillColor: '#8A2BE2', color: '#ffffff', weight: 2, fillOpacity: 1 });
            }
          }).addTo(staticGroup); 
        }
      });
    }

    if (stops && stops.length > 0) {
      stops.forEach((stop) => {
        if (stop.latitude && stop.longitude && stop.latitude !== 0) {
          const customStopIcon = L.divIcon({
            className: "custom-stop-marker",
            html: `<div style="background-color: white; border: 3px solid #3B82F6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: #1E3A8A; box-shadow: 0px 3px 6px rgba(0,0,0,0.3); text-align: center; line-height: 1.1; padding: 2px;">${stop.name}</div>`,
            iconSize: [50, 50],
            iconAnchor: [25, 25], 
          });

          L.marker([stop.latitude, stop.longitude], { icon: customStopIcon })
            .bindPopup(`<b>${stop.name}</b><br/>Code: ${stop.code}`)
            .addTo(staticGroup); 
        }
      });
    }
  }, [stops, routes, selectedVehicle]); 

  // 4. อัปเดตตำแหน่งหมุด
  useEffect(() => {
    if (mapRef.current && markerRef.current && isTracking && LRef.current) {
      const newLatLng = new LRef.current.LatLng(coords.lat, coords.lng);
      markerRef.current.setLatLng(newLatLng); 
      mapRef.current.setView(newLatLng, 17);  
    }
  }, [coords, isTracking]);

  // 5. ระบบส่งพิกัด พร้อมบันทึกประวัติ (Driver Logs)
  const startTracking = async () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    if (!selectedVehicle) {
      alert("กรุณาเลือกรถก่อนเริ่มส่งพิกัด");
      return;
    }

    setIsTracking(true);
    setSyncStatus("กำลังบันทึกประวัติการขับขี่...");

    // 🔥 บันทึกประวัติว่าใครเริ่มขับรถคันไหน
    const dId = localStorage.getItem("driverId");
    if (dId) {
      const { data: logData } = await supabase
        .from("driver_logs")
        .insert({ driver_id: parseInt(dId), vehicle_id: selectedVehicle.id, status: 'DRIVING' })
        .select().single();
      
      if (logData) setLogId(logData.id);
    }

    setSyncStatus("กำลังค้นหาสัญญาณ GPS...");

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setSyncStatus("สัญญาณ GPS อัปเดต กำลังส่งเข้าฐานข้อมูล...");

        try {
          const { data, error } = await supabase
            .from("vehicles")
            .update({ latitude: latitude, longitude: longitude })
            .eq("id", selectedVehicle.id) 
            .select(); 

          if (error) {
            setSyncStatus(`❌ บันทึกไม่สำเร็จ: ${error.message}`);
          } else {
            setSyncStatus(`✅ บันทึกลงฐานข้อมูลสำเร็จ (ล่าสุด: ${new Date().toLocaleTimeString('th-TH')})`);
          }
        } catch (err) {
          setSyncStatus(`❌ การเชื่อมต่ออินเทอร์เน็ตมีปัญหา`);
        }
      },
      (error) => {
        setSyncStatus(`❌ ดึงพิกัด GPS ไม่ได้: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    
    setWatchId(id);
  };

  const stopTracking = async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId); 
      setWatchId(null);
    }
    setIsTracking(false);
    setSyncStatus("🛑 หยุดการทำงานชั่วคราว");

    // 🔥 อัปเดตเวลาเลิกขับลงในฐานข้อมูล
    if (logId) {
      await supabase
        .from("driver_logs")
        .update({ end_time: new Date().toISOString(), status: 'COMPLETED' })
        .eq("id", logId);
      setLogId(null);
    }
  };

  const handleChangeVehicle = async () => {
    await stopTracking();
    setSelectedVehicle(null);
    setSyncStatus("รอการเริ่มต้น...");
  };

  const handleLogout = async () => {
    await stopTracking(); // หยุดส่งพิกัดก่อนออก
    localStorage.clear(); // ล้างข้อมูลการล็อกอิน
    router.push("/");
  };

  return (
    <>
      {!selectedVehicle && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col items-center justify-center p-4">
          
          {/* ปุ่มออกจากระบบสำหรับหน้าเลือกรถ */}
          <button onClick={handleLogout} className="absolute top-6 right-6 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-red-500 font-bold hover:bg-red-50">
            ออกจากระบบ
          </button>

          <div className="max-w-2xl w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800 text-center mb-2">
              {driverName ? `สวัสดี, ${driverName} 👋` : "เลือกรถที่คุณกำลังขับ"}
            </h1>
            <p className="text-gray-500 text-center mb-8">กรุณาเลือกรถบัสเพื่อเริ่มงาน และส่งพิกัดเข้าสู่ระบบ</p>
            
            {vehicles.length === 0 ? (
              <p className="text-center text-gray-400 py-10">กำลังโหลดข้อมูลรถ...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
                  >
                    <div className="text-4xl group-hover:scale-110 transition-transform">🚌</div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800 text-lg">{v.name}</div>
                      <div className="text-xs text-gray-400">{v.code}</div>
                    </div>
                    <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded-full ${v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col h-full bg-gray-50 p-2 md:p-4 gap-4 ${!selectedVehicle ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 static'}`}>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">รถ: {selectedVehicle?.name}</h1>
              <p className="text-xs text-gray-500">คนขับ: {driverName || "ไม่ทราบชื่อ"}</p>
            </div>
            
            <div className="flex gap-2">
              {!isTracking && (
                <button 
                  onClick={handleChangeVehicle}
                  className="text-sm px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  เปลี่ยนรถ
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="text-sm px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg text-sm font-medium mb-4 text-center ${
            syncStatus.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" :
            syncStatus.includes("❌") ? "bg-red-50 text-red-700 border border-red-200" :
            syncStatus.includes("⚠️") ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
            "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {syncStatus}
          </div>
          
          {isTracking && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 font-mono border border-gray-200 text-center">
              พิกัด: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={startTracking}
              disabled={isTracking}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-sm ${
                isTracking ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              ▶ เริ่มส่งพิกัด
            </button>
            
            <button
              onClick={stopTracking}
              disabled={!isTracking}
              className={`flex-1 py-3 rounded-xl font-bold transition-colors shadow-sm ${
                !isTracking ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              ⏹ หยุดส่ง / จบงาน
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[350px] relative z-0">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>
    </>
  );
}