import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../Assets/logo.png';
import './SalonServices.css';
import { API_BASE_URL, UPLOADS_URL } from '../../config/api';

const SalonServices = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '15min',
    gender: 'Unisex',
    image: '',
  });
  const [showPopup, setShowPopup] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const didFetch = useRef(false);

  // Updated Sidebar Component
  const Sidebar = () => {

    return (
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate('/dashboard')}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/calendar')}></i>
        <i className="fas fa-cut active" title="Services" onClick={() => navigate('/services')}></i>
        <i className="fas fa-comment-alt" title="Feedbacks" onClick={() => navigate('/feedbacks')}></i>
        <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className='fas fa-calendar-check' title='Book An Appointment' onClick={() => navigate('/book-appointment')}></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate('/timeslots')}></i>
      </aside>
    );
  };

  const fetchServices = useCallback(async () => {
    const salonId = salon?.id || salon?._id;
    if (!salonId) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/services/${salonId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text?.slice(0,200)}`);
      }
      const data = await res.json();
      setServices(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch services", err);
      setError('Failed to load services. Please try again.');
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
    if (name === "image") {
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
      options.push(`${hr > 0 ? hr + 'h ' : ''}${min}min`.trim());
    }
    return options;
  };

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.price || !formData.duration) return alert("Please fill all required fields");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("duration", formData.duration);
    data.append("gender", formData.gender);
    data.append("salonId", salon?.id || salon?._id);
    if (file) {
      data.append("image", file);
    } else if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      const method = editingService ? 'PUT' : 'POST';
      const url = editingService
        ? `${API_BASE_URL}/services/${editingService._id}`
        : `${API_BASE_URL}/services`;

      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        fetchServices();
        setShowPopup(false);
        setEditingService(null);
        setFormData({ name: '', price: '', duration: '15min', gender: 'Unisex', image: '' });
        setFile(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to save service");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name || '',
      price: service.price || '',
      duration: service.duration || '15min',
      gender: service.gender || 'Unisex',
      image: service.image?.startsWith("http") ? service.image : '',
    });
    setFile(null);
    setEditingService(service);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;
    try {
      await fetch(`${API_BASE_URL}/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="calendar-container">
      <Sidebar />

      <div className="main-content">
        <header className="service-header flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 bg-white rounded-lg shadow-sm mb-6">
          <div className="header-content mb-4 md:mb-0">
            <h1 className="header-title text-xl md:text-2xl font-bold text-gray-800">Services</h1>
          </div>
          <div className="header-actions w-full md:w-auto">
            <button className="add-btn w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => {
              setFormData({ name: '', price: '', duration: '15min', gender: 'Unisex', image: '' });
              setFile(null);
              setEditingService(null);
              setShowPopup(true);
            }}>Add Service</button>
          </div>
        </header>

        <div className="services-body flex flex-col lg:flex-row gap-6 px-4 md:px-6">
          <div className="category-panel lg:w-1/4 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="category-title text-lg font-semibold mb-4">Categories</h3>
            <div className="category-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded mb-2">
              <span>Hair & Styling</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{services.length}</span>
            </div>
            <div className="category-link text-blue-600 cursor-pointer hover:text-blue-800 text-sm">Add Category</div>
          </div>

          <div className="service-panel flex-1">
            <div className="service-panel-header mb-4">
              <h3 className="text-lg font-semibold">Hair & Styling</h3>
            </div>

            <div className="service-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {error && (
                <div className="service-card bg-red-50 text-red-700 p-4 rounded">{error}</div>
              )}
              {loading ? (
                <div className="service-card bg-white p-4 rounded shadow-sm">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="service-card bg-white p-4 rounded shadow-sm">No services found.</div>
              ) : services.map((service) => (
                <div key={service._id} className="service-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <img
                    src={
                      service.image
                        ? service.image.startsWith("http")
                          ? service.image
                          : `${UPLOADS_URL}/${service.image}`
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
                    }
                    alt={service.name}
                    className="service-image w-full h-32 md:h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="service-info mb-3">
                      <strong className="block text-lg font-semibold text-gray-800">{service.name}</strong>
                      <span className="text-sm text-gray-600">{service.duration}</span>
                    </div>
                    <div className="service-price flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">LKR {service.price}</span>
                      <div className="flex gap-2">
                        <i className="fas fa-edit edit-icon text-blue-600 hover:text-blue-800 cursor-pointer text-sm" onClick={() => handleEdit(service)}></i>
                        <i className="fas fa-trash delete-icon text-red-600 hover:text-red-800 cursor-pointer text-sm" onClick={() => handleDelete(service._id)}></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>{editingService ? 'Edit Service' : 'Add Service'}</h2>
            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Service Name" />
            <input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="Price (LKR)" />
            <select name="duration" value={formData.duration} onChange={handleInputChange}>
              {generateDurations().map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
            <select name="gender" value={formData.gender} onChange={handleInputChange}>
              <option>Unisex</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            <input type="file" name="image" accept="image/*" onChange={handleInputChange} />
            <input type="text" name="image" value={formData.image} onChange={handleInputChange} placeholder="Image URL (optional)" />
            <div className="popup-actions">
              <button className="btn-save" onClick={handleAddOrUpdate}>{editingService ? 'Update' : 'Add'} Service</button>
              <button className="btn-cancel" onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonServices;