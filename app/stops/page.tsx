"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";

export default function StopsPage() {
  const [stops, setStops] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStops() {
      const { data } = await supabase.from("stops").select("*").order("id", { ascending: true });
      if (data) setStops(data);
    }
    fetchStops();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stops</h1>
          <p className="text-gray-500 text-sm">Manage bus stops & GPS locations</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Stop
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <th className="p-4">Code</th>
              <th className="p-4">Stop Name</th>
              <th className="p-4">Latitude</th>
              <th className="p-4">Longitude</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {stops.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-800">{s.code}</td>
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4 font-mono text-xs">{s.latitude || "0.0000"}</td>
                <td className="p-4 font-mono text-xs">{s.longitude || "0.0000"}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}