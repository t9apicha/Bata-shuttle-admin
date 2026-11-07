"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. เช็คสิทธิ์ แอดมิน (Admin)
      // สมมติรหัสแอดมินเบื้องต้น (คุณสามารถเปลี่ยน หรือไปดึงจากตาราง admins ภายหลังได้)
      if (identifier === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin");
        router.push("/"); // ล็อกอินสำเร็จ พาไปหน้า Dashboard
        return;
      }

      // 2. เช็คสิทธิ์ คนขับรถ (Driver)
      // ดึงข้อมูลจากตาราง drivers ที่เราเพิ่งสร้างไป
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("emp_code", identifier)
        .single();

      // ถ้าเจอข้อมูลคนขับในระบบ (สำหรับคนขับใช้รหัสพนักงานเป็นทั้ง username/password เพื่อง่ายต่อการใช้งาน)
      if (driver && password === driver.emp_code) {
        // บันทึกข้อมูลคนขับลง LocalStorage เพื่อให้หน้า Tracker ดึงชื่อไปใช้
        localStorage.setItem("userRole", "driver");
        localStorage.setItem("driverId", driver.id.toString());
        localStorage.setItem("driverName", driver.name);
        localStorage.setItem("driverCode", driver.emp_code);
        
        router.push("/tracker"); // ล็อกอินสำเร็จ พาไปหน้าส่งพิกัด
        return;
      }

      setError("❌ รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    } catch (err) {
      setError("❌ เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header แถบสีด้านบน */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl">🚌</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ShuttleTrack</h1>
          <p className="text-blue-100 text-sm">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {/* ฟอร์ม Login */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสพนักงาน / Username</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                placeholder="กรอกรหัสพนักงานหรือยูสเซอร์เนม"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน / Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                placeholder="กรอกรหัสผ่าน"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-lg shadow-md transition-all ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }`}
            >
              {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* ข้อมูลสำหรับทดสอบ (ลบออกได้เมื่อใช้งานจริง) */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
            <p className="font-bold text-gray-700 mb-2">📌 ข้อมูลสำหรับทดสอบ:</p>
            <p><strong>แอดมิน:</strong> User: <code className="bg-white px-1 rounded">admin</code> | Pass: <code className="bg-white px-1 rounded">admin123</code></p>
            <p><strong>คนขับ:</strong> User: <code className="bg-white px-1 rounded">1001</code> | Pass: <code className="bg-white px-1 rounded">1001</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}