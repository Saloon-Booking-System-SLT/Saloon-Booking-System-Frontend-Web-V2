import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "../../Api/axios";
import maleIcon from "../../Assets/man.png";
import femaleIcon from "../../Assets/feee.png";
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import {
  UsersIcon,
  UserPlusIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  DocumentCheckIcon,
  ClockIcon,
  FunnelIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { UPLOADS_URL } from "../../config/api";

const SalonProfessionals = () => {
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didFetch = useRef(false);

  const [genderFilter, setGenderFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    service: "",
    serviceAvailability: "Both",
    imageType: "icon", // "icon" | "upload"
    selectedIcon: "",
  });

  const [fileImage, setFileImage] = useState(null);
  const [fileCertificate, setFileCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  // Gender icon options
  const genderIcons = {
    Male: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male1&backgroundColor=b6e3f4&hairColor=4a5568&clothingColor=3182ce",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male2&backgroundColor=c0aede&hairColor=2d3748&clothingColor=805ad5",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male3&backgroundColor=d1d4f9&hairColor=1a202c&clothingColor=38b2ac",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male4&backgroundColor=ffd5dc&hairColor=4a5568&clothingColor=e53e3e",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male5&backgroundColor=bee3f8&hairColor=2d3748&clothingColor=667eea",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=male6&backgroundColor=c6f6d5&hairColor=1a202c&clothingColor=48bb78",
    ],
    Female: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female1&backgroundColor=ffdfbf&hairColor=4a5568&clothingColor=ed64a6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female2&backgroundColor=ffd5dc&hairColor=2d3748&clothingColor=f687b3",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female3&backgroundColor=c0aede&hairColor=1a202c&clothingColor=9f7aea",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female4&backgroundColor=b6e3f4&hairColor=4a5568&clothingColor=4299e1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female5&backgroundColor=fbb6ce&hairColor=2d3748&clothingColor=fc8181",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=female6&backgroundColor=fef5e7&hairColor=1a202c&clothingColor=fbbf24",
    ],
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "",
      service: "",
      serviceAvailability: "Both",
      imageType: "icon",
      selectedIcon: "",
    });
    setFileImage(null);
    setFileCertificate(null);
    setEditingProfessional(null);
  };

  const fetchProfessionals = useCallback(async () => {
    const salonId = salon?.id || salon?._id;

    if (!salonId) {
      setError("Salon information not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`/professionals/${salonId}`);
      setProfessionals(res.data || []);
    } catch (err) {
      console.error("Fetch failed", err);
      setError("Failed to load professionals. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [salon?.id, salon?._id]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleInput = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "gender" && prev.gender !== value) {
        updated.selectedIcon = "";
        setFileImage(null);
      }

      if (name === "imageType" && value === "icon") {
        setFileImage(null);
      }

      return updated;
    });
  };

  const handleAddOrUpdate = async () => {
    const salonId = salon?.id || salon?._id;

    if (!salonId) {
      alert("Salon information not found.");
      return;
    }

    if (!formData.name || !formData.service || !formData.gender) {
      alert("Please fill all required fields.");
      return;
    }

    if (
      formData.imageType === "icon" &&
      !formData.selectedIcon &&
      !(editingProfessional && editingProfessional.imageUrl)
    ) {
      alert("Please select a gender icon.");
      return;
    }

    if (
      formData.imageType === "upload" &&
      !fileImage &&
      !(editingProfessional && editingProfessional.image)
    ) {
      alert("Please upload a custom image.");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("gender", formData.gender);
    form.append("service", formData.service);
    form.append("serviceAvailability", formData.serviceAvailability);
    form.append("salonId", salonId);
    form.append("imageType", formData.imageType);

    if (formData.imageType === "icon" && formData.selectedIcon) {
      form.append("imageUrl", formData.selectedIcon);
    }

    if (formData.imageType === "upload" && fileImage) {
      form.append("image", fileImage);
    }

    if (fileCertificate) {
      form.append("certificate", fileCertificate);
    }

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingProfessional) {
        await axios.put(`/professionals/${editingProfessional._id}`, form, config);
      } else {
        await axios.post("/professionals", form, config);
      }

      await fetchProfessionals();
      setShowPopup(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (pro) => {
    const isIconBased = !!pro.imageUrl;

    setFormData({
      name: pro.name || "",
      gender: pro.gender || "",
      service: pro.service || "",
      serviceAvailability: pro.serviceAvailability || "Both",
      imageType: isIconBased ? "icon" : "upload",
      selectedIcon: pro.imageUrl || "",
    });

    setFileImage(null);
    setFileCertificate(null);
    setEditingProfessional(pro);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this professional?")) return;

    try {
      await axios.delete(`/professionals/${id}`);
      await fetchProfessionals();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const handleViewCertificate = (base64) => {
    if (!base64) {
      alert("No certificate uploaded.");
      return;
    }

    const newWindow = window.open();
    if (!newWindow) {
      alert("Popup blocked. Please allow popups.");
      return;
    }

    newWindow.document.write(
      `<iframe src="data:application/pdf;base64,${base64}" width="100%" height="100%" style="border:none;"></iframe>`
    );
  };

  const getProfessionalImage = (pro) => {
    if (pro.imageUrl) {
      return pro.imageUrl;
    }

    if (pro.image) {
      if (typeof pro.image === "string") {
        if (pro.image.startsWith("data:image") || pro.image.startsWith("http")) {
          return pro.image;
        }

        // If it looks like base64 (no slashes or extensions) we return it as base64
        // A simple test: does it contain a dot? Filenames have dots (e.g. .jpg)
        // Or if it contains slashes, it's definitively a path
        if (pro.image.includes(".") || pro.image.includes("/") || pro.image.includes("\\")) {
          const normalizedPath = pro.image.replace(/\\/g, '/');
          const finalPath = normalizedPath.includes('/') ? normalizedPath : `professionals/${normalizedPath}`;
          return `${UPLOADS_URL}/${finalPath}`;
        }

        // Otherwise fallback to base64
        return `data:image/jpeg;base64,${pro.image}`;
      }
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      pro.name || "Professional"
    )}&background=random&size=100&color=fff`;
  };

  const filteredProfessionals = professionals.filter((pro) => {
    const genderMatch = genderFilter === "All" || pro.gender === genderFilter;
    const availabilityMatch =
      availabilityFilter === "All" ||
      pro.serviceAvailability === availabilityFilter;

    return genderMatch && availabilityMatch;
  });

  const totalProfessionals = professionals.length;
  const maleCount = professionals.filter((pro) => pro.gender === "Male").length;
  const femaleCount = professionals.filter((pro) => pro.gender === "Female").length;
  const bothAvailabilityCount = professionals.filter(
    (pro) => pro.serviceAvailability === "Both"
  ).length;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden">
        <OwnerHeader />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <UsersIcon className="w-7 h-7 text-primary-600" />
                Salon Professionals
              </h1>
              <p className="text-gray-500 mt-1 ml-10">Manage your barbers, stylists, and staff.</p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowPopup(true);
              }}
              className="btn-primary py-2.5 px-5 whitespace-nowrap flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Add Professional
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Total</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-gray-900 leading-none">{totalProfessionals}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Male Specialists</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-gray-900 leading-none">{maleCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Female Specialists</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-gray-900 leading-none">{femaleCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Serving Both</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-gray-900 leading-none">{bothAvailabilityCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600"></div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 pl-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              Filter Professionals
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-700 min-w-[160px]"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-700 min-w-[160px]"
              >
                <option value="All">All Service Availability</option>
                <option value="Male">Male Only</option>
                <option value="Female">Female Only</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
              <XMarkIcon className="w-5 h-5 text-red-500" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Professionals Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse h-64"></div>
              ))}
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <UsersIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No professionals found.</p>
              <button onClick={() => setShowPopup(true)} className="mt-4 text-primary-600 font-bold hover:text-primary-700">
                + Add New Professional
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map((pro) => (
                <div key={pro._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full">
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="absolute top-4 right-4 bg-gray-50 px-2 py-1 rounded-full flex items-center gap-1 border border-gray-100">
                      <StarIconSolid className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">4.8</span>
                    </div>

                    <div className="flex flex-col items-center mb-5 text-center px-4">
                      <div className="relative mb-3">
                        <img
                          src={getProfessionalImage(pro)}
                          alt={pro.name}
                          className="w-24 h-24 rounded-full object-cover bg-gray-50 shadow-sm border-4 border-white"
                        />
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{pro.name}</h3>
                      <p className="text-sm font-medium text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        {pro.service || "Service not set"} Specialist
                      </p>
                    </div>

                    <div className="space-y-3 mb-5 flex-1 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                          <UserIcon className="w-4 h-4 text-gray-400" /> Gender
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded-md ${pro.gender === "Male" ? "bg-blue-100 text-blue-800" :
                          pro.gender === "Female" ? "bg-pink-100 text-pink-800" :
                            "bg-gray-200 text-gray-800"
                          }`}>
                          {pro.gender || "Not specified"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                          <UsersIcon className="w-4 h-4 text-gray-400" /> Serves
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          {pro.serviceAvailability || "Both"}
                        </span>
                      </div>
                    </div>

                    {/* Certificate Status */}
                    <div className="mt-auto">
                      {pro.certificate ? (
                        <button
                          onClick={() => handleViewCertificate(pro.certificate)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group/cert"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover/cert:scale-105 transition-transform">
                              <DocumentCheckIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-900 leading-tight">Verified Professional</p>
                              <p className="text-xs text-emerald-700">Certificate Available</p>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/80">
                          <div className="bg-white p-1.5 rounded-lg shadow-sm">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700 leading-tight">Pending Verification</p>
                            <p className="text-xs text-gray-500">No certificate uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => handleEdit(pro)}
                      className="flex-1 flex justify-center items-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm"
                    >
                      <PencilSquareIcon className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pro._id)}
                      className="flex-1 flex justify-center items-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                    >
                      <TrashIcon className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in overflow-y-auto" onClick={() => { setShowPopup(false); resetForm(); }}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden relative my-8 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header Background */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white relative shrink-0">
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                onClick={() => { setShowPopup(false); resetForm(); }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-1">{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>
              <p className="text-primary-100 text-sm opacity-90">Keep your salon roster vibrant by sharing a few quick details.</p>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Professional Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                    placeholder="E.g. Alex Perera"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder-gray-400"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Primary Service</label>
                  <input
                    name="service"
                    value={formData.service}
                    onChange={handleInput}
                    placeholder="E.g. Hair Coloring"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder-gray-400"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Service Availability</label>
                  <select
                    name="serviceAvailability"
                    value={formData.serviceAvailability}
                    onChange={handleInput}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  >
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 mt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Gender</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.gender === "Male" ? "border-primary-500 bg-primary-50" : "border-gray-100 bg-white hover:border-primary-200"
                      }`}>
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === "Male"}
                        onChange={handleInput}
                        className="hidden"
                      />
                      <img src={maleIcon} alt="Male" className="w-12 h-12" />
                      <span className="font-bold text-sm text-gray-700">Male</span>
                    </label>

                    <label className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.gender === "Female" ? "border-primary-500 bg-primary-50" : "border-gray-100 bg-white hover:border-primary-200"
                      }`}>
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === "Female"}
                        onChange={handleInput}
                        className="hidden"
                      />
                      <img src={femaleIcon} alt="Female" className="w-12 h-12 flex-shrink-0" />
                      <span className="font-bold text-sm text-gray-700">Female</span>
                    </label>
                  </div>
                </div>

                {formData.gender && (
                  <div className="col-span-1 md:col-span-2 mt-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Choose Image Type</label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="imageType"
                          value="icon"
                          checked={formData.imageType === "icon"}
                          onChange={handleInput}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        Select Generated Icon
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="imageType"
                          value="upload"
                          checked={formData.imageType === "upload"}
                          onChange={handleInput}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        Upload Custom Image
                      </label>
                    </div>

                    {formData.imageType === "icon" && Array.isArray(genderIcons[formData.gender]) ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select a {formData.gender} Icon</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {genderIcons[formData.gender].map((iconUrl, index) => (
                            <div
                              key={index}
                              onClick={() => setFormData((prev) => ({ ...prev, selectedIcon: iconUrl }))}
                              className={`relative aspect-square rounded-xl cursor-pointer overflow-hidden border-2 transition-all ${formData.selectedIcon === iconUrl ? "border-primary-500 shadow-md ring-2 ring-primary-200" : "border-transparent hover:border-gray-300"
                                }`}
                            >
                              <img src={iconUrl} alt={`Avatar option ${index + 1}`} className="w-full h-full object-cover bg-white" />
                              {formData.selectedIcon === iconUrl && (
                                <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full p-0.5">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : formData.imageType === "upload" ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Upload Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFileImage(e.target.files[0])}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                        />
                        {fileImage && <p className="mt-2 text-sm text-gray-600 font-medium truncate">Selected: {fileImage.name}</p>}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 mt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Upload Certificate <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setFileCertificate(e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
                    />
                    {fileCertificate && <p className="mt-2 text-sm text-gray-600 font-medium truncate">Selected: {fileCertificate.name}</p>}
                    <p className="mt-2 text-xs text-gray-500 italic">Certificates build client trust and highlight expertise. PDF files only.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end shrink-0">
              <button
                className="px-5 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={() => { setShowPopup(false); resetForm(); }}
              >
                Cancel
              </button>
              <button
                className="btn-primary py-2.5 px-6"
                onClick={handleAddOrUpdate}
              >
                {editingProfessional ? "Save Changes" : "Create Professional"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonProfessionals;