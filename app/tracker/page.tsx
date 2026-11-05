"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; // ตรวจสอบให้แน่ใจว่า import ถูกต้องตามโปรเจกต์ของคุณ

export default function TrackerPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setIsTracking(true);

    // คำสั่งจับพิกัด GPS ตลอดเวลาที่รถเคลื่อนที่
    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // ส่งพิกัดใหม่ไปอัปเดตที่ตาราง vehicles บน Supabase (สมมติว่าอัปเดตรถคันที่ id = 1)
        const { error } = await supabase
          .from("vehicles")
          .update({ latitude: latitude, longitude: longitude })
          .eq("id", 1); 

        if (error) console.error("Error updating GPS:", error);
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">ระบบส่งพิกัดรถบัส</h1>
        <p className="mb-6 text-sm text-gray-500">
          สถานะ: {isTracking ? <span className="text-green-500 font-semibold">กำลังส่งข้อมูล...</span> : <span className="text-red-500">หยุดการทำงาน</span>}
        </p>
        
        {isTracking && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm text-gray-600 font-mono">
            Lat: {coords.lat.toFixed(5)} <br/> Lng: {coords.lng.toFixed(5)}
          </div>
        )}

        <button
          onClick={startTracking}
          disabled={isTracking}
          className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
            isTracking ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {isTracking ? "ระบบทำงานอยู่" : "เริ่มส่งพิกัด GPS"}
        </button>
      </div>
    </div>
  );
}