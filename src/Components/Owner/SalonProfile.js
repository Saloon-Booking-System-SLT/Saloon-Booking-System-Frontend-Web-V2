import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Api/axios";
import { API_BASE_URL, UPLOADS_URL } from "../../config/api";
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import {
  BuildingStorefrontIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  ScissorsIcon,
  CameraIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const SalonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const imageFileRef = useRef(null);

  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureForm, setClosureForm] = useState({
    startDate: "",
    endDate: "",
    type: "full",
    startTime: "",
    endTime: "",
    reason: ""
  });

  const handleAddClosure = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE_URL}/salons/${id}/closures`, closureForm);
      setSalon(prev => ({ ...prev, temporaryClosures: res.data.temporaryClosures }));
      setShowClosureModal(false);
      setClosureForm({
        startDate: "",
        endDate: "",
        type: "full",
        startTime: "",
        endTime: "",
        reason: ""
      });
      alert("Temporary closure added successfully!");
    } catch (err) {
      console.error("Failed to add closure:", err);
      alert(err.response?.data?.message || "Failed to add closure!");
    }
  };

  const handleDeleteClosure = async (closureId) => {
    if (!window.confirm("Are you sure you want to remove this temporary closure?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/salons/${id}/closures/${closureId}`);
      setSalon(prev => ({ ...prev, temporaryClosures: res.data.temporaryClosures }));
      alert("Temporary closure removed successfully!");
    } catch (err) {
      console.error("Failed to remove closure:", err);
      alert("Failed to remove closure!");
    }
  };

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/salons/${id}`);
        setSalon(res.data);
        setFormData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch salon:", err);
        setLoading(false);
      }
    };
    fetchSalon();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/salons/${id}`, formData);
      alert("Profile updated successfully!"); // Ideally replace with a toast
      setSalon(formData);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Update failed!");
    }
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
    return imagePath.startsWith("http") ? imagePath : `${UPLOADS_URL}/${imagePath}`;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);

      // Configured axios auto-attaches the Bearer token via interceptor
      const res = await axios.put(`salons/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newImageUrl = res.data.image;
      if (newImageUrl) {
        setSalon(prev => ({ ...prev, image: newImageUrl }));
        setFormData(prev => ({ ...prev, image: newImageUrl }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden">
        <OwnerHeader />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
            <div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-primary-600 transition-colors mr-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <BuildingStorefrontIcon className="w-7 h-7 text-primary-600" />
                  Salon Profile
                </h1>
              </div>
              <p className="text-gray-500 mt-1 ml-14">Manage your salon's public information and settings.</p>
            </div>

            {!loading && salon && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary py-2.5 px-5 whitespace-nowrap flex items-center gap-2"
              >
                <PencilSquareIcon className="w-5 h-5" />
                Edit Profile
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading profile details...</p>
            </div>
          ) : !salon ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
              <p className="font-bold text-lg mb-2">Salon Not Found</p>
              <p>We couldn't retrieve the requested salon profile.</p>
              <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl font-medium transition-colors">
                Go Back
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Profile Header Background */}
              <div className="h-32 md:h-48 bg-gradient-to-r from-primary-700 to-primary-500 relative">
                <div className="absolute inset-0 bg-white/10 pattern-diagonal-lines opacity-20"></div>
              </div>

              <div className="px-6 sm:px-10 pb-10 relative">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 sm:-mt-20 mb-8 relative z-10">
                  {/* Avatar with upload overlay */}
                  <div className="relative inline-block group/avatar">
                    <img
                      src={getImageSrc(salon.image)}
                      alt="Salon"
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover bg-white p-2 shadow-lg border-2 border-white"
                    />
                    {/* Camera overlay — always visible, triggers upload */}
                    <button
                      type="button"
                      onClick={() => imageFileRef.current?.click()}
                      disabled={imageUploading}
                      className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                      title="Change salon photo"
                    >
                      {imageUploading
                        ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <>
                          <CameraIcon className="w-7 h-7 text-white mb-1" />
                          <span className="text-white text-xs font-bold">Change Photo</span>
                        </>
                      }
                    </button>
                    <input
                      ref={imageFileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div className="pb-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{salon.name}</h2>
                    <p className="text-primary-600 font-bold mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Salon
                    </p>
                  </div>
                </div>

                {editing ? (
                  <form onSubmit={handleSubmit} className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
                      <PencilSquareIcon className="w-5 h-5 text-primary-600" />
                      Edit Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Salon Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Working Hours</label>
                        <input
                          type="text"
                          name="workingHours"
                          value={formData.workingHours || ''}
                          onChange={handleChange}
                          placeholder="e.g. Mon-Fri 9AM - 8PM"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Salon Type</label>
                        <input
                          type="text"
                          name="salonType"
                          value={formData.salonType || ''}
                          onChange={handleChange}
                          placeholder="e.g. Hair Salon, Barbershop"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Weekly Closed Day</label>
                        <select
                          name="closedDay"
                          value={formData.closedDay || 'Sunday'}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        >
                          <option value="None">None</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Services (comma separated)</label>
                        <input
                          type="text"
                          name="services"
                          value={formData.services?.join(", ") || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              services: e.target.value.split(",").map((s) => s.trim()),
                            })
                          }
                          placeholder="e.g. Haircut, Coloring, Styling"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">Separate each service with a comma.</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <XMarkIcon className="w-5 h-5" /> Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary sm:w-auto w-full py-3 px-8 flex items-center justify-center gap-2"
                      >
                        <CheckIcon className="w-5 h-5" /> Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Contact & Details */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Info</h3>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Email Address</p>
                              <p className="text-sm font-bold text-gray-900">{salon.email || 'Not provided'}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <PhoneIcon className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Phone Number</p>
                              <p className="text-sm font-bold text-gray-900">{salon.phone || 'Not provided'}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <MapPinIcon className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Location</p>
                              <p className="text-sm font-bold text-gray-900">{salon.location || 'Not provided'}</p>
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Business Info</h3>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <ClockIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Working Hours</p>
                              <p className="text-sm font-bold text-gray-900">{salon.workingHours || 'Not provided'}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <ClockIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Weekly Closed Day</p>
                              <p className="text-sm font-bold text-red-600">{salon.closedDay || 'None'}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <BuildingStorefrontIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500">Salon Type</p>
                              <span className="inline-block mt-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg capitalize">
                                {salon.salonType || 'Not specified'}
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right Column - Services */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                          <ScissorsIcon className="w-6 h-6 text-primary-600" />
                          <h3 className="text-lg font-bold text-gray-900">Offered Services Outline</h3>
                        </div>

                        {salon.services && salon.services.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {salon.services.map((service, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <ScissorsIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">No services currently listed.</p>
                            <p className="text-sm text-gray-400 mt-1">Click 'Edit Profile' to add your services.</p>
                          </div>
                        )}
                      </div>

                      {/* Salon Closures & Holidays */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-primary-600" />
                            <h3 className="text-lg font-bold text-gray-900">Salon Closures & Holidays</h3>
                          </div>
                          <button
                            onClick={() => setShowClosureModal(true)}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            + Add Closure
                          </button>
                        </div>

                        {salon.temporaryClosures && salon.temporaryClosures.length > 0 ? (
                          <div className="space-y-3">
                            {salon.temporaryClosures.map((closure) => (
                              <div
                                key={closure._id}
                                className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded ${
                                      closure.type === "full"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {closure.type === "full" ? "Full Day" : "Partial Day"}
                                    </span>
                                    <span className="text-sm font-bold text-gray-800">
                                      {closure.startDate === closure.endDate
                                        ? closure.startDate
                                        : `${closure.startDate} to ${closure.endDate}`}
                                    </span>
                                  </div>
                                  {closure.type === "short" && (
                                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                      <ClockIcon className="w-3.5 h-3.5" />
                                      {closure.startTime} - {closure.endTime}
                                    </p>
                                  )}
                                  {closure.reason && (
                                    <p className="text-xs text-gray-600 italic">Reason: {closure.reason}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteClosure(closure._id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Remove closure"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium text-sm">No temporary closures or holidays scheduled.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Temporary Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-primary-600" />
                Add Temporary Closure
              </h3>
              <button
                onClick={() => setShowClosureModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddClosure} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={closureForm.startDate}
                    onChange={e => setClosureForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={closureForm.endDate}
                    onChange={e => setClosureForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Closure Type</label>
                <select
                  value={closureForm.type}
                  onChange={e => setClosureForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="full">Full Day Closure</option>
                  <option value="short">Custom Hours (Partial Day)</option>
                </select>
              </div>

              {closureForm.type === "short" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Start Time</label>
                    <input
                      type="time"
                      required={closureForm.type === "short"}
                      value={closureForm.startTime}
                      onChange={e => setClosureForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">End Time</label>
                    <input
                      type="time"
                      required={closureForm.type === "short"}
                      value={closureForm.endTime}
                      onChange={e => setClosureForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Staff training, Holiday, Renovation"
                  value={closureForm.reason}
                  onChange={e => setClosureForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="w-1/2 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 btn-primary py-2 font-bold"
                >
                  Save Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonProfile;
