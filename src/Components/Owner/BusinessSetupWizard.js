import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import maleFemaleImage from '../../Assets/male-female.png';
import manIcon from '../../Assets/man_icon.png';
import womenIcon from '../../Assets/women_icon.png';
import { API_BASE_URL } from '../../config/api';
import { BuildingStorefrontIcon, ScissorsIcon, MapPinIcon, PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsSubmitting(true);
      const step1Data = JSON.parse(localStorage.getItem('salonRegisterData'));

      if (!step1Data) {
        alert("Session expired. Please start the registration process again.");
        navigate('/register');
        return;
      }

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
          navigate('/OwnerLogin');
        } else {
          alert(data.message || 'Registration failed');
        }
      } catch (err) {
        console.error('Registration error:', err);
        alert('Server error. Try again later.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSalonImage(e.target.files[0]);
    }
  };

  const isContinueDisabled =
    (step === 1 && !businessName.trim()) ||
    (step === 2 && !selectedService) ||
    (step === 3 && !locationAddress.trim()) ||
    isSubmitting;

  const getStepIcon = (stepNum) => {
    switch (stepNum) {
      case 1: return <BuildingStorefrontIcon className="h-6 w-6" />;
      case 2: return <ScissorsIcon className="h-6 w-6" />;
      case 3: return <MapPinIcon className="h-6 w-6" />;
      case 4: return <PhotoIcon className="h-6 w-6" />;
      default: return <CheckCircleIcon className="h-6 w-6" />;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="fade-in-up">
            <h1 className="text-3xl font-heading font-black text-gray-900 mb-2">What's your business name?</h1>
            <p className="text-gray-500 mb-8">This is how clients will see you on our platform.</p>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Business Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-gray-900 outline-none"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Royal Beauty Salon"
                  autoFocus
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="fade-in-up">
            <h1 className="text-3xl font-heading font-black text-gray-900 mb-2">What services do you offer?</h1>
            <p className="text-gray-500 mb-8">Select the primary focus of your salon to help us categorize you.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'Unisex', label: 'Unisex', img: maleFemaleImage },
                { id: 'male', label: 'Male', img: manIcon },
                { id: 'female', label: 'Female', img: womenIcon },
              ].map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${selectedService === service.id
                      ? 'border-dark-900 bg-dark-50 shadow-md transform -translate-y-1'
                      : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                >
                  {selectedService === service.id && (
                    <div className="absolute top-4 right-4 text-dark-900">
                      <CheckCircleIcon className="h-6 w-6 solid" />
                    </div>
                  )}
                  <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center p-4 transition-colors ${selectedService === service.id ? 'bg-white shadow-sm' : 'bg-gray-50'
                    }`}>
                    <img src={service.img} alt={service.label} className="w-full h-full object-contain" />
                  </div>
                  <span className={`font-semibold text-lg ${selectedService === service.id ? 'text-dark-900' : 'text-gray-600'
                    }`}>
                    {service.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="fade-in-up w-full h-full flex flex-col">
            <h1 className="text-3xl font-heading font-black text-gray-900 mb-2">Set your location</h1>
            <p className="text-gray-500 mb-6">Where can clients find you? Click the map to pinpoint your salon.</p>

            <div className="space-y-4 flex-grow flex flex-col">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-gray-900 outline-none cursor-default"
                  value={locationAddress}
                  readOnly
                  placeholder="Click on the map below to set your exact location"
                />
              </div>

              <div className="flex-grow rounded-2xl overflow-hidden border border-gray-200 shadow-sm min-h-[300px] md:min-h-[400px] relative z-0">
                <MapContainer
                  center={coordinates}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
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
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fade-in-up">
            <h1 className="text-3xl font-heading font-black text-gray-900 mb-2">Upload Salon Image</h1>
            <p className="text-gray-500 mb-8">A great photo helps attract more clients to your salon.</p>

            <div className="w-full max-w-xl mx-auto">
              {/* File Upload Area */}
              <label
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${salonImage ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                {salonImage ? (
                  <>
                    <img
                      src={URL.createObjectURL(salonImage)}
                      alt="Salon Preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity">
                      <PhotoIcon className="w-10 h-10 mb-2" />
                      <span className="font-semibold">Click to change image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold text-dark-900">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Top Header / Progress Area */}
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight text-gray-900 uppercase">
            Account Setup
          </div>
          <div className="text-sm font-medium text-gray-400">
            Step {step} of 4
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="max-w-5xl mx-auto px-6 pb-6 pt-2">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0"></div>

            {/* Active Line */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-dark-900 rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>

            {/* Steps */}
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`relative z-10 flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${s < step
                    ? 'bg-dark-900 border-dark-900 text-white'
                    : s === step
                      ? 'bg-white border-dark-900 text-dark-900 shadow-md scale-110'
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}
              >
                {s < step ? <CheckCircleIcon className="w-6 h-6" /> : getStepIcon(s)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col w-full max-w-5xl mx-auto px-6 py-8 md:py-12">
        <div className="flex-grow bg-white flex flex-col min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-6 pb-8">
          <div>
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
            ) : (
              <div /> // Placeholder to maintain flex-between spacing
            )}
          </div>

          <button
            onClick={handleContinue}
            disabled={isContinueDisabled}
            className={`px-8 py-3 rounded-xl font-bold shadow-md transition-all duration-300 flex items-center ${isContinueDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-dark-900 text-white hover:bg-black hover:shadow-dark-900/30'
              }`}
          >
            {isSubmitting ? 'Processing...' : step === 4 ? 'Complete Registration' : 'Continue'}
            {(!isSubmitting && step < 4) && (
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
            {(!isSubmitting && step === 4) && (
              <CheckCircleIcon className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetupWizard;
