import React, { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  HeartIcon as HeartIconOutline,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Footer from '../Shared/Footer';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editPopup, setEditPopup] = useState(false);
  const [addressPopup, setAddressPopup] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData({
        name: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        gender: parsed.gender || "",
      });
      fetchFavorites();
    }
  }, [navigate]);

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFavoritesLoading(false);
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites);
      }
    } catch (err) {
 console.error("Error fetching favorites:", err);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const removeFavorite = async (salonId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/favorites/${salonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setFavorites(favorites.filter(salon => salon._id !== salonId));
      }
    } catch (err) {
 console.error("Error removing favorite:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setEditPopup(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  // Switch tabs
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-dark-900"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* Sidebar matching searchsalon.js */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col z-20 sticky top-0 md:h-screen">
        <div className="p-8 border-b border-gray-100">
          <div
            className="text-3xl font-black text-dark-900 tracking-tighter cursor-pointer select-none"
            onClick={() => navigate("/")}
          >

          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center font-bold text-gray-600 shadow-inner overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-tight block">{user?.name || "User"}</span>
              <span className="text-xs text-gray-500">{user?.email || "Customer"}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === "profile" || activeTab === "address"
              ? "bg-dark-900 text-white shadow-md shadow-dark-900/10"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <UserCircleIcon className="w-5 h-5" />
            Profile & Settings
          </button>

          <button
            onClick={() => navigate("/appointments")}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold"
          >
            <CalendarDaysIcon className="w-5 h-5" />
            Appointments
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === "favorites"
              ? "bg-dark-900 text-white shadow-md shadow-dark-900/10"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <HeartIconOutline className="w-5 h-5" />
            Favorites
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-8 lg:p-12 relative">
        <div className="max-w-4xl mx-auto space-y-8 fade-in slide-up">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                {activeTab === "favorites" ? "My Favorites" : "My Profile"}
              </h1>
              <p className="mt-2 text-gray-500 font-medium">
                {activeTab === "favorites" ? "Salons you've saved for later." : "Manage your personal information and addresses."}
              </p>
            </div>
          </div>

          {(activeTab === "profile" || activeTab === "address") && (
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-dark-900 to-gray-800 relative"></div>

                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setEditPopup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold transition-colors shadow-sm"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                <div className="px-8 pb-8">
                  <div className="relative -mt-16 mb-6 flex items-end">
                    <div className="w-32 h-32 rounded-3xl border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
                      <img
                        src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.name + "&background=random&size=200&color=fff"}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">{user.name}</h2>
                      <div className="text-gray-500 font-medium mb-6">{user.email}</div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                            <span className="text-gray-400">📱</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</div>
                            <div className="font-medium text-gray-900">{user.phone || "Not provided"}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                            <span className="text-gray-400">👤</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gender</div>
                            <div className="font-medium text-gray-900">{user.gender || "Not provided"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 section-fade-in delay-100">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Saved Addresses</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage your delivery and billing addresses.</p>
                  </div>
                  <button
                    onClick={() => setAddressPopup(true)}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:text-dark-900 hover:border-dark-900 hover:shadow-md transition-all shrink-0"
                  >
                    <PlusIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {user.address && user.address.length > 0 ? (
                    user.address.map((addr, i) => (
                      <div key={i} className="group relative bg-gray-50 border border-gray-100 p-5 rounded-2xl hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 shrink-0 text-gray-400">
                            {addr.type.toLowerCase() === 'home' ? '🏠' : addr.type.toLowerCase() === 'work' ? '🏢' : <MapPinIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{addr.type}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{addr.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                        <MapPinIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses saved</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Add an address to make future bookings faster.</p>
                      <button
                        onClick={() => setAddressPopup(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-dark-900 font-bold rounded-xl hover:border-dark-900 hover:shadow-sm transition-all text-sm"
                      >
                        <PlusIcon className="w-4 h-4" /> Add your first address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-4 sm:p-8 section-fade-in delay-100">
              {favoritesLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <div className="w-12 h-12 border-4 border-gray-100 border-t-dark-900 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Loading your favorite salons...</p>
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {favorites.map((salon) => (
                    <div key={salon._id} className="group relative bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:border-dark-900 transition-colors shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300 flex flex-col">
                      <div className="h-40 relative">
                        <img
                          src={salon.image?.startsWith("http") ? salon.image : `${process.env.REACT_APP_API_URL?.replace(/\/api$/, '')}/uploads/${salon.image || ""}`}
                          onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Salon&background=random&size=300&color=fff"; }}
                          alt={salon.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          onClick={() => removeFavorite(salon._id)}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all shadow-sm"
                          title="Remove from favorites"
                        >
                          <HeartIconSolid className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-black text-gray-900 truncate pr-2">{salon.name}</h4>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                            {salon.salonType || "Salon"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mb-6">
                          <MapPinIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{salon.location}</span>
                        </p>

                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <button
                            onClick={() => navigate(`/searchsalon`, { state: { salon } })} /* Navigating back to search to view salon, might need better link*/
                            className="w-full py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-md shadow-dark-900/10"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <HeartIconOutline className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-500 max-w-sm mb-8 font-medium">Keep track of the salons you love by clicking the heart icon when browsing.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-8 py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-dark-900/20"
                  >
                    Discover Salons
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Edit Profile Modal */}
      <Transition appear show={editPopup} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditPopup(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <Dialog.Title as="h3" className="text-xl font-black text-gray-900 tracking-tight">
                      Edit Profile
                    </Dialog.Title>
                    <button onClick={() => setEditPopup(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900 appearance-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      className="w-full py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      onClick={() => setEditPopup(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-dark-900/20"
                      onClick={handleUpdateProfile}
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Address Modal */}
      <AddAddressPopup
        isOpen={addressPopup}
        close={() => setAddressPopup(false)}
        user={user}
        setUser={setUser}
      />

    </div>
  );
};

// Address Add Popup Component
const AddAddressPopup = ({ isOpen, close, user, setUser }) => {
  const [type, setType] = useState("Home");
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (!text.trim()) {
      alert("Please enter an address.");
      return;
    }
    const updated = { ...user, address: [...(user.address || []), { type, text }] };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      close();
      setText(""); // reset
    } catch (err) {
      alert("Failed to add address");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-black text-gray-900 tracking-tight">
                    Add New Address
                  </Dialog.Title>
                  <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Address Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900 appearance-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Address Details</label>
                    <textarea
                      placeholder="Street, City, Landmark etc."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all font-medium text-gray-900 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    className="w-full py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    onClick={close}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-dark-900/20"
                    onClick={handleAdd}
                  >
                    Save Address
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      <Footer />
    </Transition>
  );
};

export default Profile;
