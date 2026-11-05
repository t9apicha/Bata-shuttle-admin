"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; // ตรวจสอบ path ของ supabase client ให้ตรงกับโปรเจกต์คุณ

export default function TrackerPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setIsTracking(true);

    // watchPosition จะทำงานอัตโนมัติทุกครั้งที่รถขยับ
    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // ส่งพิกัดใหม่ไปอัปเดตที่ตาราง vehicles (สมมติว่ารถคันนี้ id = 1)
        const { error } = await supabase
          .from("vehicles")
          .update({ latitude: latitude, longitude: longitude })
          .eq("id", 1); 

        if (error) console.error("Error updating GPS:", error);
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 } // บังคับใช้ GPS แม่นยำสูง
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">ระบบส่งพิกัดรถบัส (GPS)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm text-center">
        <p className="mb-4 text-gray-600">
          สถานะ: {isTracking ? "🟢 กำลังส่งข้อมูลพิกัด..." : "🔴 หยุดการทำงาน"}
        </p>
        {isTracking && (
          <p className="text-sm text-blue-600 mb-6">
            Lat: {coords.lat.toFixed(5)} <br/> Lng: {coords.lng.toFixed(5)}
          </p>
        )}
        <button
          onClick={startTracking}
          disabled={isTracking}
          className={`w-full py-3 rounded-lg font-bold text-white ${
            isTracking ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isTracking ? "ระบบทำงานอยู่" : "เริ่มส่งพิกัด GPS"}
        </button>
      </div>
    </div>
  );
}