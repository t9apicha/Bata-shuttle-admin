"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  stops: any[];
  routes?: any[];
  vehicles?: any[]; // รับข้อมูลรถจริงมาวาด
}

export default function Map({ stops, routes = [], vehicles = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // แยกตัวแปรเช็คการวาดป้ายกับเส้นทางออกจากกัน
  const stopsDrawnRef = useRef(false); 
  const routesDrawnRef = useRef(false);
  const vehicleMarkersRef = useRef<{ [key: number]: L.Marker }>({}); 

  // 1. สร้างแผนที่ (ทำแค่ครั้งเดียว)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([13.9649, 100.5872], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    
    mapInstanceRef.current = map;

    // 🔥 แก้บั๊กขอบแผนที่สีเทา (บังคับให้ Leaflet คำนวณขนาดใหม่หลังโหลดเสร็จ)
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. วาดเส้นทางสายรถ
  useEffect(() => {
    if (!mapInstanceRef.current || routesDrawnRef.current || routes.length === 0) return;
    const map = mapInstanceRef.current;

    routes.forEach((route) => {
      if (route.path_coordinates) {
          let geoData = route.path_coordinates;
          if (typeof geoData === 'string') {
            try { geoData = JSON.parse(geoData); } catch(e){}
          }

        L.geoJSON(geoData, {
          style: function () {
            return { color: route.color || '#4B0082', weight: 5, opacity: 0.8 };
          },
          pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, { radius: 6, fillColor: '#8A2BE2', color: '#ffffff', weight: 2, fillOpacity: 1 });
          }
        }).addTo(map);
      }
    });
    
    routesDrawnRef.current = true; // บันทึกว่าวาดเส้นทางเสร็จแล้ว
  }, [routes]);

  // 3. วาดป้ายจอดรถ
  useEffect(() => {
    if (!mapInstanceRef.current || stopsDrawnRef.current || stops.length === 0) return;
    const map = mapInstanceRef.current;

    stops.forEach((stop) => {
      if (stop.latitude && stop.longitude && stop.latitude !== 0) {
        const customStopIcon = L.divIcon({
          className: "custom-stop-marker",
          html: `<div style="background-color: white; border: 3px solid #3B82F6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: #1E3A8A; box-shadow: 0px 3px 6px rgba(0,0,0,0.3); text-align: center; line-height: 1.1; padding: 2px;">
            ${stop.name}
          </div>`,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });

        L.marker([stop.latitude, stop.longitude], { icon: customStopIcon })
          .addTo(map)
          .bindPopup(`<b>${stop.name}</b><br/>Code: ${stop.code}`);
      }
    });
    
    stopsDrawnRef.current = true; // บันทึกว่าวาดป้ายเสร็จแล้ว
  }, [stops]);

  // 4. ระบบวาดและอัปเดตตำแหน่งรถ (Real-time)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    vehicles.forEach((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const newPos: [number, number] = [vehicle.latitude, vehicle.longitude];

      if (vehicleMarkersRef.current[vehicle.id]) {
        // รถขยับ
        vehicleMarkersRef.current[vehicle.id].setLatLng(newPos);
      } else {
        // รถโผล่มาครั้งแรก
        const busIcon = L.divIcon({
          className: "custom-bus-icon",
          html: `<div style="font-size: 24px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transition: transform 0.8s ease-out;">🚌</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(newPos, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
        marker.bindPopup(`<b>${vehicle.name}</b><br/>สถานะ: ${vehicle.status}`);
        
        vehicleMarkersRef.current[vehicle.id] = marker; 
      }
    });
  }, [vehicles]); 

  return <div ref={mapRef} className="h-full w-full border-0 z-0" style={{ zIndex: 0 }} />;
}