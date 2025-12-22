import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMap = ({ 
  center = { lat: 12.9716, lng: 77.5946 }, 
  zoom = 12, 
  markers = [], 
  onMapLoad,
  className = "w-full h-96"
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: "AIzaSyAlwkR078ja6eYka4GoD98JPkQoCf4jiaE" ,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      try {
        const google = await loader.load();
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
        setIsLoaded(true);
        
        if (onMapLoad) {
          onMapLoad(mapInstance, google);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (mapRef.current) {
      initMap();
    }
  }, []);

  useEffect(() => {
    if (map && isLoaded && markers.length > 0) {
      // Clear existing markers
      markers.forEach(markerData => {
        if (markerData.marker) {
          markerData.marker.setMap(null);
        }
      });

      // Add new markers
      markers.forEach(markerData => {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map: map,
          title: markerData.title,
          icon: markerData.icon || null
        });

        if (markerData.infoWindow) {
          const infoWindow = new google.maps.InfoWindow({
            content: markerData.infoWindow
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }

        markerData.marker = marker;
      });

      // Fit bounds if multiple markers
      if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(markerData => {
          bounds.extend(markerData.position);
        });
        map.fitBounds(bounds);
      }
    }
  }, [map, isLoaded, markers]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;