"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, User, Lock, Loader2, AlertCircle, Info, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // จำลองระยะเวลาโหลดเพื่อความสวยงามของ UX
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin");
        router.push("/admin");
      } else if (username === "1001" && password === "1001") {
        localStorage.setItem("userRole", "driver");
        router.push("/tracker");
      } else {
        setError("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
      }
    }, 1200); // หน่วงเวลา 1.2 วินาที
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* ฝั่งซ้าย: แบนเนอร์กราฟิก (แสดงเฉพาะบนจอคอม) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 relative overflow-hidden items-center justify-center">
        {/* วงกลมตกแต่งฉากหลัง */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-white text-center p-12">
          <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md mb-8 border border-white/30 shadow-2xl">
            <Bus className="w-24 h-24 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-md">
            ShuttleTrack RSU
          </h1>
          <p className="text-blue-100 text-lg max-w-md font-light leading-relaxed">
            ระบบบริหารจัดการและติดตามรถรับส่งภายในมหาวิทยาลัยแบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* ฝั่งขวา: ฟอร์มล็อกอิน */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 lg:bg-white relative">
        <div className="w-full max-w-md">
          {/* โลโก้สำหรับจอมือถือ (ซ่อนบนจอคอม) */}
          <div className="flex flex-col items-center lg:hidden mb-10">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg mb-4">
              <Bus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ShuttleTrack RSU</h1>
            <p className="text-sm text-gray-500 mt-2">ลงชื่อเข้าใช้งานระบบ</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 lg:shadow-none lg:border-none lg:p-0 lg:bg-transparent">
            <div className="hidden lg:block mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">ยินดีต้อนรับ 👋</h2>
              <p className="text-gray-500">กรุณาลงชื่อเข้าใช้เพื่อเข้าสู่ระบบ</p>
            </div>

            {/* กล่องแจ้งเตือน Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* ช่อง Username */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">รหัสพนักงาน / Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-800"
                    placeholder="กรอกรหัสพนักงาน"
                    required
                  />
                </div>
              </div>

              {/* ช่อง Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">รหัสผ่าน / Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-800"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                </div>
              </div>

              {/* ปุ่ม Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-lg transition-all ${
                  isLoading 
                    ? "bg-blue-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* ข้อมูลสำหรับทดสอบ (Test Credentials) */}
            <div className="mt-10 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-blue-800">
                <Info className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">ข้อมูลทดสอบระบบ</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded-xl border border-blue-50">
                  <p className="text-gray-500 text-xs mb-1">แอดมิน (Admin)</p>
                  <p className="font-semibold text-gray-800">admin <span className="text-gray-300 font-normal">/</span> admin123</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-50">
                  <p className="text-gray-500 text-xs mb-1">คนขับ (Driver)</p>
                  <p className="font-semibold text-gray-800">1001 <span className="text-gray-300 font-normal">/</span> 1001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}