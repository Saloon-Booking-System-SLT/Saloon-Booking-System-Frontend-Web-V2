import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const SalonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/salons/${id}`);
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
      await axios.put(`http://localhost:5000/api/salons/${id}`, formData);
      alert("Profile updated successfully!");
      setSalon(formData);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Update failed!");
    }
  };

  if (loading) return <p className="loading-text">Loading profile...</p>;
  if (!salon) return <p className="error-text">Salon not found.</p>;

  return (
    <div className="salon-profile-wrapper">
      <button className="back-icon-btn" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="salon-profile-card">
        <h2 className="profile-heading">Salon Profile</h2>

        {editing ? (
          <form onSubmit={handleSubmit} className="salon-edit-form">
            <label>
              Name:
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
            </label>
            <label>
              Email:
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </label>
            <label>
              Phone:
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </label>
            <label>
              Location:
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
            </label>
            <label>
              Working Hours:
              <input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange} />
            </label>
            <label>
              Salon Type:
              <input type="text" name="salonType" value={formData.salonType} onChange={handleChange} />
            </label>
            <label>
              Services (comma separated):
              <input
                type="text"
                name="services"
                value={formData.services?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    services: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </label>

            <div className="form-btns">
              <button type="submit" className="save-btn">
                Save
              </button>
              <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="salon-profile-view">
          <img
  src={
    salon.image
      ? salon.image.startsWith("http")
        ? salon.image // external URL
        : `http://localhost:5000/uploads/${salon.image}` // uploaded image
      : "https://via.placeholder.com/120" // default placeholder
  }
  alt="Salon"
  className="salon-avatar"
/>

            <p><strong>Name:</strong> {salon.name}</p>
            <p><strong>Email:</strong> {salon.email}</p>
            <p><strong>Phone:</strong> {salon.phone}</p>
            <p><strong>Location:</strong> {salon.location}</p>
            <p><strong>Working Hours:</strong> {salon.workingHours}</p>
            <p><strong>Salon Type:</strong> {salon.salonType}</p>
            <p><strong>Services:</strong> {salon.services?.join(", ")}</p>
            <button className="edit-btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonProfile;
