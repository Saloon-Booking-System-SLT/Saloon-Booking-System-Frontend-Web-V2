import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../Api/axios";
import OwnerSidebar from "./OwnerSidebar";
import OwnerHeader from "./OwnerHeader";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  ScissorsIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UPLOADS_URL } from "../../config/api";

const SalonServices = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "15min",
    gender: "Unisex",
    image: "",
  });
  const [showPopup, setShowPopup] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didFetch = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchServices = useCallback(async () => {
    const salonId = salon?.id || salon?._id;
    if (!salonId) {
      setError("Salon information not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`/services/${salonId}`);
      setServices(res.data || []);
    } catch (err) {
 console.error("Failed to fetch services", err);
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [salon?.id, salon?._id]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files) {
      setFile(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const generateDurations = () => {
    const options = [];
    for (let mins = 15; mins <= 300; mins += 5) {
      const hr = Math.floor(mins / 60);
      const min = mins % 60;
      options.push(`${hr > 0 ? `${hr}h ` : ""}${min}min`.trim());
    }
    return options;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      duration: "15min",
      gender: "Unisex",
      image: "",
    });
    setFile(null);
    setEditingService(null);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    const salonId = salon?.id || salon?._id;

    if (!salonId) {
      alert("Salon information not found");
      return;
    }

    if (!formData.name || !formData.price || !formData.duration) {
      alert("Please fill all required fields");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("duration", formData.duration);
    data.append("gender", formData.gender);
    data.append("salonId", salonId);

    if (file) {
      data.append("image", file);
    }

    try {
      if (editingService) {
        await axios.put(`/services/${editingService._id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post("/services", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await fetchServices();
      setShowPopup(false);
      resetForm();
    } catch (err) {
 console.error(err);
      alert(err.response?.data?.message || "Failed to save service");
    }
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name || "",
      price: service.price || "",
      duration: service.duration || "15min",
      gender: service.gender || "Unisex",
      image: service.image?.startsWith("http") ? service.image : "",
    });
    setFile(null);
    setEditingService(service);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await axios.delete(`/services/${id}`);
      await fetchServices();
    } catch (err) {
 console.error("Delete failed", err);
      alert("Failed to delete service");
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

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-3">
                <WrenchScrewdriverIcon className="w-7 h-7 text-primary-600" />
                Service Management
              </h1>
              <p className="text-gray-500 mt-1">Manage your salon services, prices, and durations.</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowPopup(true);
              }}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <PlusIcon className="w-5 h-5" /> Add New Service
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Categories (Static for now, but UI upgraded) */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">Categories</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-primary-50 text-primary-700 px-4 py-3 rounded-xl font-medium cursor-pointer border border-primary-100 transition-colors">
                    <span className="flex items-center gap-2">
                      <ScissorsIcon className="w-4 h-4" /> All Services
                    </span>
                    <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">{services.length}</span>
                  </div>
                  {/* Add future categories here if needed */}
                  <button className="w-full flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent border-dashed hover:border-primary-200 mt-4">
                    <PlusIcon className="w-4 h-4" /> Add Category
                  </button>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="flex-1 min-w-0">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 flex items-center gap-3">
                  <XMarkIcon className="w-5 h-5 text-red-500" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
                      <div className="w-full h-40 bg-gray-200 rounded-xl mb-4"></div>
                      <div className="h-5 bg-gray-200 w-3/4 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 w-1/2 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 w-1/3 rounded"></div>
                        <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-500 mb-6 max-w-sm">You haven't added any services to your salon yet. Add your first service to start taking bookings.</p>
                  <button onClick={() => { resetForm(); setShowPopup(true); }} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Your First Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div
                      key={service._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all overflow-hidden flex flex-col group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {service.image ? (
                          <img
                            src={service.image.startsWith("http") ? service.image : `${UPLOADS_URL}/${service.image.replace(/\\/g, '/').includes('/') ? service.image.replace(/\\/g, '/') : `services/${service.image}`}`}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <PhotoIcon className="w-12 h-12 opacity-50 mb-2" />
                            <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200/50 shadow-sm">
                          {service.duration}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{service.name}</h4>
                        <p className="text-sm text-gray-500 mb-4">{service.gender} Service</p>

                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xl font-black text-primary-600">LKR {service.price}</span>
                          <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(service)}
                              className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-blue-100 hover:border-blue-600"
                              title="Edit Service"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service._id)}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors border border-red-100 hover:border-red-600"
                              title="Delete Service"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal / Popup Form */}
      {showPopup && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden fade-in relative">

            <button
              onClick={() => { setShowPopup(false); resetForm(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors absolute right-4 top-4"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingService ? "Edit Service" : "Add New Service"}
              </h2>

              <form onSubmit={handleAddOrUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Classic Haircut"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors outline-none text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (LKR)</label>
                    <input
                      name="price"
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors outline-none text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors outline-none text-gray-800 appearance-none"
                    >
                      {generateDurations().map((d, idx) => (
                        <option key={idx} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience (Gender)</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors outline-none text-gray-800 appearance-none"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none text-gray-500 flex flex-col items-center">
                      <PhotoIcon className="w-8 h-8 mb-2 opacity-60" />
                      <span className="text-sm font-medium">{file ? file.name : "Click or drag to upload"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => { setShowPopup(false); resetForm(); }} className="flex-1 btn-secondary text-sm">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary text-sm shadow-md">
                    {editingService ? "Save Changes" : "Create Service"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonServices;