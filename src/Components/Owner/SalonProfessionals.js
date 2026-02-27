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
    imageType: "icon", // 'icon' or 'upload'
  });

  const [fileImage, setFileImage] = useState(null);
  const [fileCertificate, setFileCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  // Gender icon options - diverse professional avatars
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

  const [selectedIcon, setSelectedIcon] = useState("");

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

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset icon selection when gender changes
    if (name === "gender") {
      setSelectedIcon("");
    }
  };

  // Add or Update professional
  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.service || !formData.gender)
      return alert("Please fill all required fields.");

    // Validate image selection
    if (formData.imageType === "icon" && !selectedIcon && !editingProfessional?.imageUrl) {
      return alert("Please select a gender icon or upload an image.");
    }

    if (formData.imageType === "upload" && !fileImage && !editingProfessional?.image) {
      return alert("Please upload an image or select a gender icon.");
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("gender", formData.gender);
    form.append("service", formData.service);
    form.append("serviceAvailability", formData.serviceAvailability);
    form.append("salonId", salon.id);

    // Handle image based on type
    if (formData.imageType === "upload" && fileImage) {
      form.append("image", fileImage);
      form.append("imageType", "upload");
    } else if (formData.imageType === "icon" && selectedIcon) {
      form.append("imageUrl", selectedIcon);
      form.append("imageType", "icon");
    }

    if (fileCertificate) {
      form.append("certificate", fileCertificate);
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const res = editingProfessional
        ? await axios.put(`/professionals/${editingProfessional._id}`, form, config)
        : await axios.post('/professionals', form, config);
      
      fetchProfessionals();
      setShowPopup(false);
      setEditingProfessional(null);
      setFormData({ name: "", gender: "", service: "", serviceAvailability: "Both", imageType: "icon" });
      setFileImage(null);
      setFileCertificate(null);
      setSelectedIcon("");
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
      imageType: pro.imageUrl ? "icon" : "upload",
    });
    
    if (pro.imageUrl) {
      setSelectedIcon(pro.imageUrl);
    }
    
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

  // SalonProfessionalsV2.js - Fixed getProfessionalImage function

// Get professional image - FIXED!
const getProfessionalImage = (pro) => {
  // Case 1: Icon image (URL)
  if (pro.imageUrl) {
    return pro.imageUrl;
  } 
  // Case 2: Uploaded image - already stored as complete data URL from backend
  else if (pro.image) {
    // Check if it's already a complete data URL
    if (pro.image.startsWith('data:image')) {
      return pro.image; // Return as-is
    }
    // Fallback for legacy data (should not happen with new backend)
    return `data:image/jpeg;base64,${pro.image}`;
  } 
  // Case 3: No image - generate avatar
  else {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random&size=100&color=fff`;
  }
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
        <header className="pro-v2-header">
          <h1>Salon Professionals</h1>
          <button
            className="pro-v2-add-btn"
            onClick={() => {
              setShowPopup(true);
              setEditingProfessional(null);
              setFormData({ name: "", gender: "", service: "", serviceAvailability: "Both", imageType: "icon" });
              setSelectedIcon("");
              setFileImage(null);
              setFileCertificate(null);
            }}
          >
            Add Professional
          </button>
        </header>
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

        

        {/* Professional cards */}
        <div className="pro-v2-grid">
          {filteredProfessionals.map((pro) => (
            <div key={pro._id} className="pro-v2-card">
              <img
                src={getProfessionalImage(pro)}
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

            {/* Image selection type */}
            <div className="image-selection-type">
              <label>Choose Image Type:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="imageType"
                    value="icon"
                    checked={formData.imageType === "icon"}
                    onChange={handleInput}
                  />
                  <span>Select Gender Icon</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="imageType"
                    value="upload"
                    checked={formData.imageType === "upload"}
                    onChange={handleInput}
                  />
                  <span>Upload Custom Image</span>
                </label>
              </div>
            </div>

            {/* Conditional rendering based on image type */}
            {formData.imageType === "icon" ? (
              <div className="icon-selection">
                {formData.gender ? (
                  <>
                    <label>Select a {formData.gender} Icon:</label>
                    <div className="icon-grid">
                      {genderIcons[formData.gender]?.map((iconUrl, index) => (
                        <div
                          key={index}
                          className={`icon-option ${selectedIcon === iconUrl ? "selected" : ""}`}
                          onClick={() => setSelectedIcon(iconUrl)}
                        >
                          <img src={iconUrl} alt={`${formData.gender} icon ${index + 1}`} />
                          {selectedIcon === iconUrl && (
                            <div className="icon-check">
                              <i className="fas fa-check-circle"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="info-text">
                    <i className="fas fa-info-circle"></i>
                    Please select a gender first to see icon options
                  </p>
                )}
              </div>
            ) : (
              <div className="upload-section">
                <label>Upload Custom Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFileImage(e.target.files[0])} 
                />
                {fileImage && (
                  <div className="file-preview">
                    <i className="fas fa-image"></i>
                    <p>{fileImage.name}</p>
                  </div>
                )}
              </div>
            )}

            <div className="upload-section">
              <label>Upload Certificate (Optional)</label>
              <input 
                type="file" 
                accept=".pdf,application/pdf"
                onChange={(e) => setFileCertificate(e.target.files[0])} 
              />
              {fileCertificate && (
                <div className="file-preview">
                  <i className="fas fa-file-pdf"></i>
                  <p>{fileCertificate.name}</p>
                </div>
              )}
            </div>

            <div className="pro-v2-popup-actions">
              <button className="pro-v2-save-btn" onClick={handleAddOrUpdate}>
                <i className="fas fa-save"></i>
                {editingProfessional ? "Update" : "Add"} Professional
              </button>
              <button className="pro-v2-cancel-btn" onClick={() => setShowPopup(false)}>
                <i className="fas fa-times"></i>
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