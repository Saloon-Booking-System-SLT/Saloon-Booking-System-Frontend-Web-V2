import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix leaflet's default icon paths
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// 🧠 Component to control map and zoom to selected location
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14); // 👈 Zoom into location
    }
  }, [center, map]);
  return null;
};

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect }) => {
  const [position, setPosition] = useState(null);

  // Allow user to click map and pick location
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });

    return position === null ? null : <Marker position={position} />;
  }

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(userLocation); // 👈 This will auto zoom using <ChangeMapView>
      },
      () => alert("Unable to retrieve your location.")
    );
  };

  const handleConfirm = () => {
    if (!position) {
      alert("Please select a location on the map.");
      return;
    }
    onLocationSelect(position);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          width: "90%",
          maxWidth: 500,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3>Select Your Location</h3>
        <button className="btn" onClick={findMyLocation}>
          Find My Location
        </button>
        <div className="map-container" style={{ height: 300, width: "100%", marginTop: 10 }}>
          <MapContainer
            center={position || { lat: 7.8731, lng: 80.7718 }}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {position && <ChangeMapView center={position} />}
            <LocationMarker />
          </MapContainer>
        </div>
        <div
          className="modal-buttons"
          style={{
            marginTop: 10,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button className="btn btn-confirm" onClick={handleConfirm}>
            Confirm Location
          </button>
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
