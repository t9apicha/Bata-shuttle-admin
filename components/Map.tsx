"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  stops: any[];
  routes?: any[];
}

export default function Map({ stops, routes }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([13.9649, 100.5872], 16);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // ตัวแปรสำหรับเคลียร์รถบัสเมื่อเปลี่ยนหน้า
    let moveIntervals: NodeJS.Timeout[] = [];

    // =====================================
    // 1. วาด GeoJSON และ ทำรถบัสวิ่ง
    // =====================================
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        if (route.path_coordinates) {
          // วาดเส้นทางสีม่วง
          L.geoJSON(route.path_coordinates, {
            style: function () {
              return { color: route.color || '#4B0082', weight: 5, opacity: 0.8 };
            },
            pointToLayer: function (feature, latlng) {
              return L.circleMarker(latlng, {
                radius: 6, fillColor: '#8A2BE2', color: '#ffffff', weight: 2, fillOpacity: 1
              });
            }
          }).addTo(map);

          // ----------------------------------------------------
          // 🚌 ระบบจำลองรถบัสวิ่งตามเส้นทาง GeoJSON
          // ----------------------------------------------------
          try {
            // ดึงพิกัดจาก GeoJSON (ต้องเข้าถึง Array ของ coordinates)
            let coords: [number, number][] = [];
            const geoData = route.path_coordinates;
            
            // เช็กโครงสร้างที่ได้จาก geojson.io
            if (geoData.type === "FeatureCollection" && geoData.features.length > 0) {
               // หาฟีเจอร์ที่เป็นเส้นทาง (LineString)
               const lineFeature = geoData.features.find((f: any) => f.geometry && f.geometry.type === "LineString");
               if (lineFeature) coords = lineFeature.geometry.coordinates;
            }

            if (coords.length > 0) {
              // สร้างไอคอนรูปรถบัส (ใช้ Emoji ง่ายและแสดงผลชัวร์)
              const busIcon = L.divIcon({
                className: "custom-bus-icon",
                html: `<div style="font-size: 24px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transition: transform 1s linear;">🚌</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });

              // เริ่มต้นที่จุดแรกสุด (GeoJSON เรียงแบบ [Lng, Lat] ต้องสลับเป็น [Lat, Lng] ให้ Leaflet)
              let currentIndex = 0;
              const startPos: [number, number] = [coords[0][1], coords[0][0]];
              const busMarker = L.marker(startPos, { icon: busIcon }).addTo(map);
              
              busMarker.bindPopup(`<b>รถบัสกำลังวิ่ง: ${route.name}</b>`);

              // สั่งให้รถวิ่งเปลี่ยนจุดทุกๆ 1 วินาที (1000 ms)
              const interval = setInterval(() => {
                currentIndex++;
                if (currentIndex >= coords.length) {
                  currentIndex = 0; // ถึงปลายทางแล้ววนกลับไปจุดเริ่มต้นใหม่
                }
                const nextPos: [number, number] = [coords[currentIndex][1], coords[currentIndex][0]];
                busMarker.setLatLng(nextPos);
              }, 1000); // <-- เปลี่ยนความเร็วตรงนี้ได้ (เลขน้อย = วิ่งเร็ว)

              moveIntervals.push(interval);
            }
          } catch (error) {
            console.error("Error animating bus:", error);
          }
        }
      });
    }

    // =====================================
    // 2. ปักหมุดจุดจอดปกติ (ดึงจากตาราง stops)
    // =====================================
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    stops.forEach((stop) => {
      if (stop.latitude && stop.longitude && stop.latitude !== 0) {
        L.marker([stop.latitude, stop.longitude], { icon: defaultIcon })
          .addTo(map)
          .bindPopup(`<b>${stop.name}</b><br/>Code: ${stop.code}`);
      }
    });

    // ล้างข้อมูลเวลาเปลี่ยนหน้าเว็บ
    return () => {
      moveIntervals.forEach(clearInterval); // หยุดรถวิ่งเมื่อเปลี่ยนหน้า
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops, routes]);

  return <div ref={mapRef} className="h-full w-full border-0 z-0" style={{ zIndex: 0 }} />;
}