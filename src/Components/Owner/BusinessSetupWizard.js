import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessSetupWizard.css';
import maleFemaleImage from '../../Assets/male-female.png';
import manIcon from '../../Assets/man_icon.png';
import womenIcon from '../../Assets/women_icon.png';
import { API_BASE_URL } from '../../config/api';

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const centerDefault = {
  lat: 6.9271,
  lng: 79.8612,
};

// Reverse geocode function
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Component for selecting location
const LocationPicker = ({ coordinates, setCoordinates, setLocationAddress }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });
      const address = await reverseGeocode(lat, lng);
      setLocationAddress(address);
    },
  });
  return <Marker position={coordinates} />;
};

const BusinessSetupWizard = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState(centerDefault);
  const [salonImage, setSalonImage] = useState(null);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleContinue = async () => {
    if (step === 1 && businessName.trim()) {
      setStep(2);
    } else if (step === 2 && selectedService) {
      setStep(3);
    } else if (step === 3 && locationAddress.trim()) {
      setStep(4);
    } else if (step === 4) {
      const step1Data = JSON.parse(localStorage.getItem('salonRegisterData'));

      const formData = new FormData();
      formData.append('name', businessName);
      formData.append('email', step1Data.email);
      formData.append('password', step1Data.password);
      formData.append('phone', step1Data.phone);
      formData.append('workingHours', step1Data.workingHours);
      formData.append('location', locationAddress);
      formData.append('services', [selectedService]);
      formData.append('salonType', selectedService);
      if (salonImage) formData.append('image', salonImage);
      formData.append('coordinates', JSON.stringify(coordinates));

      try {
        const res = await fetch(`${API_BASE_URL}/salons/register`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          alert('🎉 Salon registered successfully!');
          localStorage.removeItem('salonRegisterData');
          navigate('/');
        } else {
          alert(data.message || 'Registration failed');
        }
      } catch (err) {
        console.error('Registration error:', err);
        alert('Server error. Try again later.');
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSalonImage(e.target.files[0]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="header-text">Account setup</div>
            <h1 className="main-title">What's your business name?</h1>
            <div className="input-section">
              <label className="input-label">Business name</label>
              <input
                type="text"
                className="business-input"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="header-text">Account setup</div>
            <h1 className="main-title">What services do you offer?</h1>
            <div className="services-grid">
              <div
                className={`service-card ${selectedService === 'Unisex' ? 'selected' : ''}`}
                onClick={() => setSelectedService('Unisex')}
              >
                <img src={maleFemaleImage} alt="Unisex" className="service-image" />
                <div className="service-label">Unisex</div>
              </div>
              <div
                className={`service-card ${selectedService === 'male' ? 'selected' : ''}`}
                onClick={() => setSelectedService('male')}
              >
                <img src={manIcon} alt="Male" className="service-image" />
                <div className="service-label">Male</div>
              </div>
              <div
                className={`service-card ${selectedService === 'female' ? 'selected' : ''}`}
                onClick={() => setSelectedService('female')}
              >
                <img src={womenIcon} alt="Female" className="service-image" />
                <div className="service-label">Female</div>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="header-text">Account setup</div>
            <h1 className="main-title">Set your location address</h1>
            <div className="input-section">
              <label className="input-label">Click on the map to pick location</label>
              <div className="input-wrapper">
                <div className="location-icon">📍</div>
                <input
                  type="text"
                  className="location-input"
                  value={locationAddress}
                  readOnly
                  placeholder="Click on the map to pick location"
                />
              </div>
            </div>

            <div style={{ height: '400px', marginTop: '15px', width: '100%' }}>
              <MapContainer
                center={coordinates}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationPicker
                  coordinates={coordinates}
                  setCoordinates={setCoordinates}
                  setLocationAddress={setLocationAddress}
                />
              </MapContainer>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="header-text">Account setup</div>
            <h1 className="main-title">Upload Salon Image</h1>
          <div className="salon-upload-container">
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="salon-upload-input"
  />
  {salonImage && (
    <img
      src={URL.createObjectURL(salonImage)}
      alt="Salon Preview"
      className="salon-upload-preview"
    />
  )}
</div>

          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <div className="progress-container">
        <div className="progress-bar">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`progress-segment ${s <= step ? 'active' : ''}`}></div>
          ))}
        </div>

        <div
          className="wizard-nav-buttons"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          {step > 1 && (
            <button className="back-button" onClick={handleBack}>
              Back
            </button>
          )}
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={
              (step === 1 && !businessName.trim()) ||
              (step === 2 && !selectedService) ||
              (step === 3 && !locationAddress.trim())
            }
          >
            {step === 4 ? 'Finish' : 'Continue'}
          </button>
        </div>
      </div>

      <div className="content-wrapper">{renderStepContent()}</div>
    </div>
  );
};

export default BusinessSetupWizard;
