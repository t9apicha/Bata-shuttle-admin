"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  stops: any[];
  routes?: any[];
  vehicles?: any[]; // รับข้อมูลรถจริงมาวาด
}

export default function Map({ stops, routes, vehicles = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  const staticDrawnRef = useRef(false); // ตัวแปรเช็คว่าวาดเส้นทางไปหรือยัง
  const vehicleMarkersRef = useRef<{ [key: number]: L.Marker }>({}); // เก็บหมุดรถทั้งหมดไว้จับขยับ

  // 1. สร้างแผนที่ (ทำแค่ครั้งเดียว)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([13.9649, 100.5872], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. วาดเส้นทางสายรถและป้ายจอด (ทำแค่ตอนเปิดหน้าเว็บ)
  useEffect(() => {
    if (!mapInstanceRef.current || staticDrawnRef.current) return;
    
    if (stops.length > 0 || (routes && routes.length > 0)) {
      const map = mapInstanceRef.current;

      // วาดเส้นทางสายรถ
      if (routes && routes.length > 0) {
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
      }

      // วาดป้ายจอดรถ
      stops.forEach((stop) => {
        if (stop.latitude && stop.longitude && stop.latitude !== 0) {
          const customStopIcon = L.divIcon({
            className: "custom-stop-marker",
            html: `<div style="background-color: white; border: 3px solid #3B82F6; border-radius: 50%; width: 50px; height: 50px; display: flex; items-center; justify-content: center; font-weight: bold; font-size: 10px; color: #1E3A8A; box-shadow: 0px 3px 6px rgba(0,0,0,0.3); text-align: center; line-height: 1.1; padding: 2px;">
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

      staticDrawnRef.current = true;
    }
  }, [stops, routes]);

  // 3. ระบบวาดและอัปเดตตำแหน่งรถ (Real-time)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    vehicles.forEach((vehicle) => {
      // ถ้ารถคันนี้ยังไม่มีพิกัด ให้ข้ามไป
      if (!vehicle.latitude || !vehicle.longitude) return;

      const newPos: [number, number] = [vehicle.latitude, vehicle.longitude];

      // ถ้าเคยวาดหมุดรถคันนี้ไปแล้ว ให้จับ "ขยับพิกัด" (setLatLng) เพื่อให้สมูทและไม่กระพริบ
      if (vehicleMarkersRef.current[vehicle.id]) {
        vehicleMarkersRef.current[vehicle.id].setLatLng(newPos);
      } else {
        // ถ้าเพิ่งโผล่มาครั้งแรก ให้สร้างหมุดรถคันใหม่
        const busIcon = L.divIcon({
          className: "custom-bus-icon",
          html: `<div style="font-size: 24px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transition: transform 0.8s ease-out;">🚌</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(newPos, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
        marker.bindPopup(`<b>${vehicle.name}</b><br/>สถานะ: ${vehicle.status}`);
        
        vehicleMarkersRef.current[vehicle.id] = marker; // เก็บหมุดไว้ในคลัง เพื่อรอขยับรอบหน้า
      }
    });

  }, [vehicles]); // โค้ดนี้จะทำงานอัตโนมัติทุกครั้งที่พิกัดรถในระบบมีการเปลี่ยนแปลง

  return <div ref={mapRef} className="h-full w-full border-0 z-0" style={{ zIndex: 0 }} />;
}