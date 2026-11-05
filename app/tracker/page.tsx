"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function TrackerPage() {
  const [isTracking, setIsTracking] = useState(false);
  // ตั้งค่าเริ่มต้นพิกัดให้เป็นแถวๆ ม.รังสิต เพื่อให้แผนที่ไม่ไปโผล่กลางทะเลก่อนที่ GPS จะจับได้
  const [coords, setCoords] = useState({ lat: 13.965, lng: 100.587 }); 
  const [watchId, setWatchId] = useState<number | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  // 1. สร้างแผนที่เมื่อเปิดหน้านี้
  useEffect(() => {
    if (typeof window !== "undefined" && mapContainer.current && !mapRef.current) {
      // สร้างแผนที่
      const map = L.map(mapContainer.current).setView([coords.lat, coords.lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // สร้างหมุดรูปวงกลมสำหรับแทนตัวรถบัส
      const busIcon = L.divIcon({
        className: "custom-bus-marker",
        html: `<div style="background-color: #EF4444; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🚌</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // ปักหมุดลงแผนที่
      const marker = L.marker([coords.lat, coords.lng], { icon: busIcon }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      // ล้างข้อมูลแผนที่เมื่อปิดหน้าเว็บ
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. อัปเดตตำแหน่งหมุดบนแผนที่ เมื่อ GPS (coords) มีการเปลี่ยนแปลง
  useEffect(() => {
    if (mapRef.current && markerRef.current && isTracking) {
      const newLatLng = new L.LatLng(coords.lat, coords.lng);
      markerRef.current.setLatLng(newLatLng); // เลื่อนหมุด
      mapRef.current.setView(newLatLng, 17);  // เลื่อนกล้องแผนที่ตาม
    }
  }, [coords, isTracking]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setIsTracking(true);

    // เก็บ ID ของการติดตามไว้ เพื่อให้ยกเลิกได้ทีหลัง
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // ส่งพิกัดใหม่ไปอัปเดตที่ตาราง vehicles (สมมติว่าอัปเดตรถคันที่ id = 1)
        const { error } = await supabase
          .from("vehicles")
          .update({ latitude: latitude, longitude: longitude })
          .eq("id", 1); 

        if (error) console.error("Error updating GPS:", error);
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId); // สั่งหยุดจับพิกัด
      setWatchId(null);
    }
    setIsTracking(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-2 md:p-4 gap-4">
      {/* ส่วนแผงควบคุม */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">ระบบส่งพิกัดรถบัส</h1>
        <p className="mb-4 text-sm text-gray-500">
          สถานะ: {isTracking ? <span className="text-green-500 font-semibold">กำลังส่งข้อมูลพิกัดและอัปเดตแผนที่...</span> : <span className="text-red-500">หยุดการทำงาน</span>}
        </p>
        
        {isTracking && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-800 font-mono">
            Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
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
            เริ่มส่งพิกัด
          </button>
          
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              !isTracking ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white shadow-md"
            }`}
          >
            หยุดส่งพิกัด
          </button>
        </div>
      </div>

      {/* ส่วนแสดงแผนที่ */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] relative z-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    </div>
  );
}