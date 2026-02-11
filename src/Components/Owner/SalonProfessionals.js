import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../../Api/axios';
import logo from "../../Assets/logo.png";
import "./SalonProfessionals.css";

const SalonProfessionalsV2 = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [genderFilter, setGenderFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    service: "",
    serviceAvailability: "Both",
  });

  const [fileImage, setFileImage] = useState(null);
  const [fileCertificate, setFileCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  const Sidebar = () => {
    return (
      <aside className="modern-sidebar">
  <img src={logo} alt="Brand Logo" className="modern-logo" />

  <i className="fas fa-home" title="Home" onClick={() => navigate("/dashboard")}></i>
  <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate("/calendar")}></i>
  <i className="fas fa-smile" title="Services" onClick={() => navigate("/services")}></i>
  <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate("/feedbacks")}></i>
  <i className="fas fa-users active" title="Professionals"></i> 
  <i className='fas fa-calendar-check' title='Book An Appointment' onClick={() => navigate('/book-appointment')}></i>
  <i className="fas fa-clock" title="Time Slots" onClick={() => navigate("/timeslots")}></i>
</aside>

    );
  };

  // Fetch professionals
  const fetchProfessionals = useCallback(async () => {
    if (!salon?.id) return;
    try {
      const res = await axios.get(`/professionals/${salon.id}`);
      setProfessionals(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  }, [salon?.id]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleInput = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Add or Update professional
  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.service || !formData.gender)
      return alert("Please fill all fields.");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("gender", formData.gender);
    form.append("service", formData.service);
    form.append("serviceAvailability", formData.serviceAvailability);
    form.append("salonId", salon.id);

    if (fileImage) form.append("image", fileImage);
    if (fileCertificate) form.append("certificate", fileCertificate);

    try {
      const res = editingProfessional
        ? await axios.put(`/professionals/${editingProfessional._id}`, form)
        : await axios.post('/professionals', form);
      
      fetchProfessionals();
      setShowPopup(false);
      setEditingProfessional(null);
      setFormData({ name: "", gender: "", service: "", serviceAvailability: "Both" });
      setFileImage(null);
      setFileCertificate(null);
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (pro) => {
    setFormData({
      name: pro.name,
      gender: pro.gender || "",
      service: pro.service,
      serviceAvailability: pro.serviceAvailability || "Both",
    });
    setEditingProfessional(pro);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      await axios.delete(`/professionals/${id}`);
      fetchProfessionals();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // View certificate as base64 PDF
  const handleViewCertificate = (base64) => {
    if (!base64) return alert("No certificate uploaded.");
    const newWindow = window.open();
    newWindow.document.write(
      `<iframe src="data:application/pdf;base64,${base64}" width="100%" height="100%"></iframe>`
    );
  };

  // Filter logic
  const filteredProfessionals = professionals.filter((pro) => {
    const genderMatch = genderFilter === "All" || pro.gender === genderFilter;
    const availabilityMatch =
      availabilityFilter === "All" || pro.serviceAvailability === availabilityFilter;
    return genderMatch && availabilityMatch;
  });

  return (
    <div className="pro-v2-container">
      {/* Sidebar */}
      <Sidebar />

      <div className="pro-v2-main">
        {/* Filters */}
        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="All">Filter by Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="All">Filter by Service Availability</option>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        <header className="pro-v2-header">
          <h1>Salon Professionals</h1>
          <button
            className="pro-v2-add-btn"
            onClick={() => {
              setShowPopup(true);
              setEditingProfessional(null);
              setFormData({ name: "", gender: "", service: "", serviceAvailability: "Both" });
            }}
          >
            Add Professional
          </button>
        </header>

        {/* Professional cards */}
        <div className="pro-v2-grid">
          {filteredProfessionals.map((pro) => (
            <div key={pro._id} className="pro-v2-card">
              <img
                src={
                  pro.image ? `data:image/jpeg;base64,${pro.image}` : "https://ui-avatars.com/api/?name=Professional&background=random&size=100&color=fff"
                }
                alt={pro.name}
                className="pro-v2-image"
              />
              <div className="pro-v2-info">
                <strong>{pro.name}</strong>
                <p>Gender: {pro.gender}</p>
                <p>Service: {pro.service}</p>
                <p>Service Availability: {pro.serviceAvailability}</p>
                {pro.certificate ? (
                  <button
                    className="pro-v2-cert-btn"
                    onClick={() => handleViewCertificate(pro.certificate)}
                  >
                    View Certificate
                  </button>
                ) : (
                  <p className="no-cert">No Certificate</p>
                )}
                <div className="pro-v2-actions">
                  <button onClick={() => handleEdit(pro)}>Edit</button>
                  <button onClick={() => handleDelete(pro._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup form */}
      {showPopup && (
        <div className="pro-v2-popup-overlay">
          <div className="pro-v2-popup">
            <h2>{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>

            <input
              name="name"
              value={formData.name}
              onChange={handleInput}
              placeholder="Name"
            />

            <select name="gender" value={formData.gender} onChange={handleInput}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              name="service"
              value={formData.service}
              onChange={handleInput}
              placeholder="Service Provided"
            />

            <select
              name="serviceAvailability"
              value={formData.serviceAvailability}
              onChange={handleInput}
            >
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
              <option value="Both">Both</option>
            </select>

            <label>Upload Image</label>
            <input type="file" onChange={(e) => setFileImage(e.target.files[0])} />

            <label>Upload Certificate</label>
            <input type="file" onChange={(e) => setFileCertificate(e.target.files[0])} />

            <div className="pro-v2-popup-actions">
              <button className="pro-v2-save-btn" onClick={handleAddOrUpdate}>
                {editingProfessional ? "Update" : "Add"}
              </button>
              <button className="pro-v2-cancel-btn" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonProfessionalsV2;
