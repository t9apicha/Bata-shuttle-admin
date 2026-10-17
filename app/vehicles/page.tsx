"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search } from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchVehicles() {
      const { data } = await supabase.from("vehicles").select("*, routes(name, color)");
      if (data) setVehicles(data);
    }
    fetchVehicles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-gray-500 text-sm">Manage all shuttle vehicles</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name..." className="w-full text-sm outline-none text-gray-600" />
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-100">
              <th className="p-4">Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Capacity</th>
              <th className="p-4">Assigned Route</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{v.name}</td>
                <td className="p-4">{v.code}</td>
                <td className="p-4">{v.capacity} seats</td>
                <td className="p-4">
                  {v.routes ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.routes.color }}></span>
                      {v.routes.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Unassigned</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {v.status}
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