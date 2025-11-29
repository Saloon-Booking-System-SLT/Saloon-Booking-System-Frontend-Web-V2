import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../Assets/logo.png';
import './SalonServices.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const UPLOADS_URL = process.env.REACT_APP_API_URL?.replace('/api', '/uploads') || 'http://localhost:5000/uploads';

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

  // Updated Sidebar Component
  const Sidebar = () => {

    return (
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate('/dashboard')}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/calendar')}></i>
        <i className="fas fa-smile active" title="Services" onClick={() => navigate('/services')}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate('/feedbacks')}></i>
        <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate('/timeslots')}></i>
      </aside>
    );
  };

  const fetchServices = useCallback(async () => {
    if (!salon?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/services/${salon.id}`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  }, [salon?.id]);

  useEffect(() => {
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
    data.append("salonId", salon.id);
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
        <header className="header">
          <div className="header-content">
            <h1 className="header-title">Services</h1>
            <div className="header-actions">
              <button className="add-btn" onClick={() => {
                setFormData({ name: '', price: '', duration: '15min', gender: 'Unisex', image: '' });
                setFile(null);
                setEditingService(null);
                setShowPopup(true);
              }}>Add</button>
            </div>
          </div>
        </header>

        <div className="services-body">
          <div className="category-panel">
            <h3 className="category-title">Categories</h3>
            <div className="category-item">
              <span>Hair & Styling</span>
              <span>{services.length}</span>
            </div>
            <div className="category-link">Add Category</div>
          </div>

          <div className="service-panel">
            <div className="service-panel-header">
              <h3>Hair & Styling</h3>
            </div>

            <div className="service-grid">
              {services.map((service) => (
                <div key={service._id} className="service-card">
                  <img
                    src={
                      service.image
                        ? service.image.startsWith("http")
                          ? service.image
                          : `${UPLOADS_URL}/${service.image}`
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
                    }
                    alt={service.name}
                    className="service-image"
                  />
                  <div className="service-info">
                    <strong>{service.name}</strong>
                    <span>{service.duration}</span>
                  </div>
                  <div className="service-price">
                    <span>LKR {service.price}</span>
                    <i className="fas fa-edit edit-icon" onClick={() => handleEdit(service)}></i>
                    <i className="fas fa-trash delete-icon" onClick={() => handleDelete(service._id)}></i>
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