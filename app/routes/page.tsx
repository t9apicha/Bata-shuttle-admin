"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRoutes() {
      const { data } = await supabase.from("routes").select("*");
      if (data) setRoutes(data);
    }
    fetchRoutes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Routes</h1>
          <p className="text-gray-500 text-sm">Manage shuttle routes and paths</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <th className="p-4">Color</th>
              <th className="p-4">Code</th>
              <th className="p-4">Route Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="w-6 h-6 rounded-lg border shadow-sm" style={{ backgroundColor: r.color }}></div>
                </td>
                <td className="p-4 font-semibold text-gray-800">{r.code}</td>
                <td className="p-4 font-medium">{r.name}</td>
                <td className="p-4 text-gray-500 text-xs">{r.description || "-"}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.isActive ? 'Active' : 'Inactive'}
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