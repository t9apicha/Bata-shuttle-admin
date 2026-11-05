"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css"; // CSS โหลดได้ปกติ ไม่มีปัญหา

export default function TrackerPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState({ lat: 13.965, lng: 100.587 }); 
  const [watchId, setWatchId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("รอการเริ่มต้น..."); 

  // ใช้ any เพราะเราจะโหลด L แบบไดนามิก
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const LRef = useRef<any>(null); // เก็บตัวแปร Leaflet ไว้ใช้ข้ามฟังก์ชัน

  // 1. สร้างแผนที่ (โหลด Leaflet แบบ Dynamic เฉพาะฝั่ง Client)
  useEffect(() => {
    if (typeof window !== "undefined" && mapContainer.current && !mapRef.current) {
      
      // นำเข้า Leaflet เฉพาะตอนที่หน้าจอทำงานแล้ว
      import("leaflet").then((L) => {
        LRef.current = L; // เก็บ L ไว้ใช้งานอัปเดตพิกัดทีหลัง

        const map = L.map(mapContainer.current!).setView([coords.lat, coords.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        const busIcon = L.divIcon({
          className: "custom-bus-marker",
          html: `<div style="background-color: #EF4444; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🚌</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: busIcon }).addTo(map);

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

  // 2. อัปเดตหมุดบนแผนที่
  useEffect(() => {
    // เช็คว่า LRef.current ถูกโหลดมาพร้อมแล้วถึงจะทำงาน
    if (mapRef.current && markerRef.current && isTracking && LRef.current) {
      const newLatLng = new LRef.current.LatLng(coords.lat, coords.lng);
      markerRef.current.setLatLng(newLatLng); 
      mapRef.current.setView(newLatLng, 17);  
    }
  }, [coords, isTracking]);

  // 3. ฟังก์ชันเริ่มจับ GPS
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

  // 4. ฟังก์ชันหยุดการทำงาน
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