import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../Assets/logo.png";
import "./SalonProfessionals.css";
import { API_BASE_URL } from "../../config/api";

const maleIcon =
  "https://cdn-icons-png.flaticon.com/512/921/921089.png";
const femaleIcon =
  "https://cdn-icons-png.flaticon.com/512/921/921071.png";

const SalonProfessionalsV2 = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didFetch = useRef(false);
  const [genderFilter, setGenderFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    service: "",
    serviceAvailability: "Both",
    selectedIcon: "",
  });

  const [fileCertificate, setFileCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  const Sidebar = () => {
    return (
      <aside className="modern-sidebar">

        

  <img src={logo} alt="Brand Logo" className="modern-logo" />

  <i className="fas fa-home" title="Home" onClick={() => navigate("/dashboard")}></i>
  <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate("/calendar")}></i>
  <i className="fas fa-cut" title="Services" onClick={() => navigate("/services")}></i>
  <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate("/feedbacks")}></i>
  <i className="fas fa-users active" title="Professionals"></i> 
  <i className='fas fa-calendar-check' title='Book An Appointment' onClick={() => navigate('/book-appointment')}></i>
  <i className="fas fa-clock" title="Time Slots" onClick={() => navigate("/timeslots")}></i>
</aside>
    );
  };

  const fetchProfessionals = async () => {
    const salonId = salon?.id || salon?._id;
    if (!salonId) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/professionals/${salonId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text?.slice(0,200)}`);
      }
      const data = await res.json();
      setProfessionals(data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch failed", err);
      setError("Failed to load professionals. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchProfessionals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id, salon?._id]);

  const handleInput = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.service || !formData.gender)
      return alert("Please fill all fields.");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("gender", formData.gender);
    form.append("service", formData.service);
    form.append("serviceAvailability", formData.serviceAvailability);
    form.append("salonId", salon?.id || salon?._id);

    // ICON saved as IMAGE to backend
    form.append("imageUrl", formData.selectedIcon);

    if (fileCertificate) form.append("certificate", fileCertificate);

    const url = editingProfessional
      ? `${API_BASE_URL}/professionals/${editingProfessional._id}`
      : `${API_BASE_URL}/professionals`;

    const method = editingProfessional ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: form });
      if (res.ok) {
        fetchProfessionals();
        setShowPopup(false);
        setEditingProfessional(null);
        setFormData({
          name: "",
          gender: "",
          service: "",
          serviceAvailability: "Both",
          selectedIcon: "",
        });
        setFileCertificate(null);
      } else {
        const error = await res.json();
        alert("Save failed: " + (error.message || "Unknown error"));
      }
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const handleEdit = (pro) => {
    setFormData({
      name: pro.name,
      gender: pro.gender || "",
      service: pro.service,
      serviceAvailability: pro.serviceAvailability || "Both",
      selectedIcon: pro.gender === "Male" ? maleIcon : femaleIcon,
    });

    setEditingProfessional(pro);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      await fetch(`${API_BASE_URL}/professionals/${id}`, { method: "DELETE" });
      fetchProfessionals();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleViewCertificate = (base64) => {
    if (!base64) return alert("No certificate uploaded.");
    const newWindow = window.open();
    newWindow.document.write(
      `<iframe src="data:application/pdf;base64,${base64}" width="100%" height="100%"></iframe>`
    );
  };

  const filteredProfessionals = professionals.filter((pro) => {
    const genderMatch = genderFilter === "All" || pro.gender === genderFilter;
    const availabilityMatch =
      availabilityFilter === "All" || pro.serviceAvailability === availabilityFilter;
    return genderMatch && availabilityMatch;
  });

  return (
    <div className="pro-v2-container">
      <Sidebar />

      <div className="pro-v2-main">
        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
              <option value="All">Filter by Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
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
              setFormData({
                name: "",
                gender: "",
                service: "",
                serviceAvailability: "Both",
                selectedIcon: "",
              });
            }}
          >
            Add Professional
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}
        <div className="pro-v2-grid">
          {loading ? (
            <div className="pro-v2-card skeleton">Loading professionals...</div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="pro-v2-card empty">No professionals found.</div>
          ) : filteredProfessionals.map((pro) => (
            <div key={pro._id} className="pro-v2-card">
              <img
                src={
                  pro.image
                    ? `data:image/jpeg;base64,${pro.image}`
                    : pro.gender === "Male"
                    ? maleIcon
                    : femaleIcon
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
                  <button className="pro-v2-cert-btn" onClick={() => handleViewCertificate(pro.certificate)}>
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

      {showPopup && (
        <div className="pro-v2-popup-overlay">
          <div className="pro-v2-popup">
            <h2>{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>

            <input name="name" value={formData.name} onChange={handleInput} placeholder="Name" />

            {/* Gender Selector with Icons */}
            <div className="gender-icon-section">
              <label>Select Gender</label>
              <div className="gender-options">
                <label className="gender-card">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        gender: "Male",
                        selectedIcon: maleIcon,
                      })
                    }
                  />
                  <img src={maleIcon} alt="Male" className="gender-icon" />
                  <p>Male</p>
                </label>

                <label className="gender-card">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        gender: "Female",
                        selectedIcon: femaleIcon,
                      })
                    }
                  />
                  <img src={femaleIcon} alt="Female" className="gender-icon" />
                  <p>Female</p>
                </label>
              </div>
            </div>

            <input
              name="service"
              value={formData.service}
              onChange={handleInput}
              placeholder="Service Provided"
            />

            <select name="serviceAvailability" value={formData.serviceAvailability} onChange={handleInput}>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
              <option value="Both">Both</option>
            </select>

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
