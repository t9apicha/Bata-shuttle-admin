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
      // 1. เช็คสิทธิ์ แอดมิน (Admin) -> พาไปหน้า /admin
      if (identifier === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin");
        router.push("/admin"); 
        return;
      }

      // 2. เช็คสิทธิ์ คนขับรถ (Driver) -> พาไปหน้า /tracker
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("emp_code", identifier)
        .single();

      if (driver && password === driver.emp_code) {
        localStorage.setItem("userRole", "driver");
        localStorage.setItem("driverId", driver.id.toString());
        localStorage.setItem("driverName", driver.name);
        localStorage.setItem("driverCode", driver.emp_code);
        
        router.push("/tracker"); 
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
        
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl">🚌</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ShuttleTrack RSU</h1>
          <p className="text-blue-100 text-sm">ระบบติดตามรถบัสและจัดการเส้นทาง</p>
        </div>

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
                placeholder="กรอกรหัสพนักงาน หรือ admin"
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

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
            <p className="font-bold text-gray-700 mb-2">📌 ข้อมูลทดสอบระบบ:</p>
            <p><strong>แอดมิน:</strong> <code>admin</code> / <code>admin123</code></p>
            <p><strong>คนขับ:</strong> <code>1001</code> / <code>1001</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}