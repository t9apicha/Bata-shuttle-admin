"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";

export default function TrackerPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState({ lat: 13.9649, lng: 100.5872 }); 
  const [watchId, setWatchId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("รอการเริ่มต้น..."); 

  const [stops, setStops] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  // แยกตัวแปรเช็คสถานะการวาดแผนที่ออกจากกัน
  const stopsDrawnRef = useRef(false); 
  const routesDrawnRef = useRef(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const LRef = useRef<any>(null); 

  // 1. ดึงข้อมูลจุดจอดและเส้นทาง (โหลดพร้อมกัน)
  useEffect(() => {
    async function fetchMapData() {
      const [stopsRes, routesRes] = await Promise.all([
        supabase.from("stops").select("*").eq("isActive", true),
        supabase.from("routes").select("*").eq("isActive", true)
      ]);
      
      if (stopsRes.data) setStops(stopsRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
    }
    fetchMapData();
  }, []);

  // 2. สร้างแผนที่หลักและหมุดรถบัส
  useEffect(() => {
    if (typeof window !== "undefined" && mapContainer.current && !mapRef.current) {
      import("leaflet").then((L) => {
        LRef.current = L; 
        const map = L.map(mapContainer.current!).setView([coords.lat, coords.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

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
      }
    };
  }, []);

  // 3. วาดเส้นทางและป้ายจอดรถ (แยกการเช็คว่าวาดหรือยัง)
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;
    
    // วาดเส้นทาง (GeoJSON) - ทำงานเมื่อมีข้อมูลและยังไม่ได้วาด
    if (routes.length > 0 && !routesDrawnRef.current) {
      routes.forEach((route) => {
        if (route.path_coordinates) {
           let geoData = route.path_coordinates;
           if(typeof geoData === 'string'){
              try {
                  geoData = JSON.parse(geoData);
              } catch(e){
                  console.error("Error parsing GeoJSON", e);
              }
           }

          L.geoJSON(geoData, {
            style: function () {
              return { color: route.color || '#4B0082', weight: 5, opacity: 0.8 };
            },
            pointToLayer: function (feature: any, latlng: any) {
              return L.circleMarker(latlng, {
                radius: 6, fillColor: '#8A2BE2', color: '#ffffff', weight: 2, fillOpacity: 1
              });
            }
          }).addTo(map);
        }
      });
      routesDrawnRef.current = true; // บันทึกว่าวาดเส้นทางเสร็จแล้ว
    }

    // วาดป้ายจอดรถ - ทำงานเมื่อมีข้อมูลและยังไม่ได้วาด
    if (stops.length > 0 && !stopsDrawnRef.current) {
      stops.forEach((stop) => {
        if (stop.latitude && stop.longitude && stop.latitude !== 0) {
          const customStopIcon = L.divIcon({
            className: "custom-stop-marker",
            html: `<div style="
              background-color: white;
              border: 3px solid #3B82F6;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 10px;
              color: #1E3A8A;
              box-shadow: 0px 3px 6px rgba(0,0,0,0.3);
              text-align: center;
              line-height: 1.1;
              padding: 2px;
            ">
              ${stop.name}
            </div>`,
            iconSize: [50, 50],
            iconAnchor: [25, 25], 
          });

          L.marker([stop.latitude, stop.longitude], { icon: customStopIcon })
            .addTo(map)
            .bindPopup(`<b>${stop.name}</b><br/>Code: ${stop.code}`);
        }
      });
      stopsDrawnRef.current = true; // บันทึกว่าวาดป้ายเสร็จแล้ว
    }
  }, [stops, routes]);

  // 4. อัปเดตตำแหน่งหมุดเมื่อ GPS ขยับ
  useEffect(() => {
    if (mapRef.current && markerRef.current && isTracking && LRef.current) {
      const newLatLng = new LRef.current.LatLng(coords.lat, coords.lng);
      markerRef.current.setLatLng(newLatLng); 
      mapRef.current.setView(newLatLng, 17);  
    }
  }, [coords, isTracking]);

  // 5. ระบบส่งพิกัด
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setIsTracking(true);
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
            .eq("id", 1)
            .select(); 

          if (error) {
            console.error("Supabase Error:", error);
            setSyncStatus(`❌ บันทึกไม่สำเร็จ: ${error.message}`);
          } else if (data && data.length === 0) {
            setSyncStatus("⚠️ เชื่อมต่อได้ แต่ไม่พบข้อมูลรถที่มี id=1");
          } else {
            setSyncStatus(`✅ บันทึกลงฐานข้อมูลสำเร็จ (ล่าสุด: ${new Date().toLocaleTimeString('th-TH')})`);
          }
        } catch (err) {
          console.error("Connection Error:", err);
          setSyncStatus(`❌ การเชื่อมต่ออินเทอร์เน็ตมีปัญหา`);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setSyncStatus(`❌ ดึงพิกัด GPS ไม่ได้: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId); 
      setWatchId(null);
    }
    setIsTracking(false);
    setSyncStatus("🛑 หยุดการทำงานชั่วคราว");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-2 md:p-4 gap-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">ระบบส่งพิกัดรถบัส</h1>
        
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${
          syncStatus.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" :
          syncStatus.includes("❌") ? "bg-red-50 text-red-700 border border-red-200" :
          syncStatus.includes("⚠️") ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
          "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {syncStatus}
        </div>
        
        {isTracking && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 font-mono border border-gray-200">
            พิกัดปัจจุบัน: <br/>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
              isTracking ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
            }`}
          >
            ▶ เริ่มส่งพิกัด
          </button>
          
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              !isTracking ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white shadow-md"
            }`}
          >
            ⏹ หยุดส่ง
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[350px] relative z-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    </div>
  );
}