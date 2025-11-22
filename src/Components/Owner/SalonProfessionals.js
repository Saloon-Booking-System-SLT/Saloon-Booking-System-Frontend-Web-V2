import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../Assets/logo.png";
import "./SalonProfessionals.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const UPLOADS_URL = process.env.REACT_APP_API_URL?.replace('/api', '/uploads') || 'http://localhost:5000/uploads';

const SalonProfessionalsV2 = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [formData, setFormData] = useState({ 
    name: "", 
    gender: "male",
    wellQualified: "no",
    qualificationDoc: null,
    serviceAvailability: "both"
  });
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [file, setFile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Filter states
  const [filterQualified, setFilterQualified] = useState(false);
  const [filterGender, setFilterGender] = useState("both");
  const [filterService, setFilterService] = useState("both");

  // Fetch professionals
  const fetchProfessionals = useCallback(async () => {
    if (!salon?.id) return;
    try {
      const params = new URLSearchParams();
      if (filterGender !== 'both') params.append('gender', filterGender);

      const res = await fetch(`${API_BASE_URL}/professionals/${salon.id}?${params}`);
      const data = await res.json();
      
      let filtered = data;
      
      // Apply qualification filter on client side
      if (filterQualified) {
        filtered = filtered.filter(p => p.wellQualified === 'yes');
      }
      
      // Apply service availability filter
      if (filterService !== 'both') {
        filtered = filtered.filter(p => p.serviceAvailability === filterService);
      }
      
      setProfessionals(filtered);
    } catch (err) {
      console.error("Failed to fetch professionals", err);
    }
  }, [salon?.id, filterGender, filterQualified, filterService]);

  useEffect(() => {
    if (salon?.id) {
      fetchProfessionals();
    }
  }, [salon?.id, fetchProfessionals]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Staff name is required";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    if (formData.wellQualified === 'yes' && !file && !editingProfessional?.qualificationDoc) {
      newErrors.qualificationDoc = "Please upload qualification document";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({ 
      name: "", 
      gender: "male",
      wellQualified: "no",
      qualificationDoc: null,
      serviceAvailability: "both"
    });
    setFile(null);
    setProfileImage(null);
    setErrors({});
    setEditingProfessional(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle file change for qualification
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.type.startsWith('image/')) {
        alert('Please select a PDF or image file');
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      setProfileImage(selectedFile);
    }
  };

  // Handle delete professional
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await fetch(`${API_BASE_URL}/professionals/${id}`, { method: "DELETE" });
      fetchProfessionals();
      alert("Staff member deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Error deleting staff member");
    }
  };

  // Handle Add/Update Professional - CORRECTED VERSION
const handleAddOrUpdateProfessional = async () => {
  if (!validateForm()) {
    return;
  }

  setLoading(true);

  try {
    // Use a different variable name for FormData to avoid conflict
    const submitData = new FormData();
    
    // Add text fields - use formData (state) not submitData (FormData)
    submitData.append("name", formData.name.trim());
    submitData.append("role", "Staff Member");
    submitData.append("salonId", salon.id);
    submitData.append("gender", formData.gender.toLowerCase());
    submitData.append("wellQualified", formData.wellQualified);
    submitData.append("serviceAvailability", formData.serviceAvailability);
    submitData.append("service", formData.service || "");

    // Add files if they exist
    if (file) {
      submitData.append("qualificationDoc", file);
      console.log("📄 Adding qualification file:", file.name);
    }
    if (profileImage) {
      submitData.append("image", profileImage);
      console.log("🖼️ Adding profile image:", profileImage.name);
    }

    const url = editingProfessional
      ? `${API_BASE_URL}/professionals/${editingProfessional._id}`
      : `${API_BASE_URL}/professionals`;

    const method = editingProfessional ? "PUT" : "POST";

    console.log(`🚀 Sending ${method} request to: ${url}`);

    const res = await fetch(url, {
      method,
      body: submitData, // Use submitData (FormData) not formData (state)
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed: ${res.status} - ${errorText}`);
    }

    await res.json();
    
    await fetchProfessionals();
    setShowPopup(false);
    setEditingProfessional(null);
    resetForm();
    alert(editingProfessional 
      ? "Staff member updated successfully!" 
      : "Staff member added successfully!"
    );

  } catch (err) {
    console.error("❌ Error:", err);
    alert(err.message || "An error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // Handle Edit
  const handleEdit = (pro) => {
    setFormData({
      name: pro.name || "",
      gender: pro.gender || "male",
      wellQualified: pro.wellQualified || "no",
      qualificationDoc: pro.qualificationDoc || null,
      serviceAvailability: pro.serviceAvailability || "both"
    });
    
    setEditingProfessional(pro);
    setFile(null);
    setProfileImage(null);
    setErrors({});
    setShowPopup(true);
  };

  // Get service availability display
  const getServiceAvailabilityDisplay = (availability) => {
    switch(availability) {
      case 'male': return 'Male Services';
      case 'female': return 'Female Services';
      case 'both': return 'Both';
      default: return 'Both';
    }
  };

  // Get image URL
  const getImageUrl = (professional) => {
    if (professional?.image) {
      if (professional.image.startsWith('http')) {
        return professional.image;
      }
      return `${UPLOADS_URL}/professionals/${professional.image}`;
    }
    return null;
  };

  // Safe gender display with fallback
  const getGenderDisplay = (gender) => {
    if (!gender) return 'Other';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Safe name fallback for avatar
  const getAvatarInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Safe role display
  const getRoleDisplay = (role) => {
    if (!role) return 'Staff Member';
    return role;
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterGender("both");
    setFilterService("both");
    setFilterQualified(false);
  };

  return (
    <div className="pro-v2-container">
      {/* Sidebar */}
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate("/dashboard")}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate("/calendar")}></i>
        <i className="fas fa-smile" title="Services" onClick={() => navigate("/services")}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate("/feedbacks")}></i>
        <i className="fas fa-users active" title="Professionals"></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate("/timeslots")}></i>
      </aside>

      {/* Main Content */}
      <div className="pro-v2-main">
        <header className="pro-v2-header">
          <h1>Salon Professionals</h1>
          <button 
            className="add-staff-btn"
            onClick={() => {
              resetForm();
              setShowPopup(true);
            }}
            disabled={loading}
          >
            + Add Staff
          </button>
        </header>

        <div className="content-wrapper">
          {/* Filters Section */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Filter by Gender:</label>
              <select 
                value={filterGender} 
                onChange={(e) => setFilterGender(e.target.value)}
                className="filter-select"
              >
                <option value="both">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Service:</label>
              <select 
                value={filterService} 
                onChange={(e) => setFilterService(e.target.value)}
                className="filter-select"
              >
                <option value="both">All Services</option>
                <option value="male">Male Services</option>
                <option value="female">Female Services</option>
                <option value="both">Both Services</option>
              </select>
            </div>

            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <div className="divider"></div>

          {/* Staff List */}
          <div className="staff-list-section">
            {professionals.length === 0 ? (
              <div className="no-staff-message">
                <p>No staff members found.</p>
                <button 
                  className="add-first-staff-btn"
                  onClick={() => {
                    resetForm();
                    setShowPopup(true);
                  }}
                >
                  Add Your First Staff Member
                </button>
              </div>
            ) : (
              <div className="staff-list">
                {professionals.map((pro) => (
                  <div key={pro._id} className="staff-item">
                    {/* Staff Info - Left Side */}
                    <div className="staff-info-container">
                      <div className="staff-avatar">
                        {getImageUrl(pro) ? (
                          <img src={getImageUrl(pro)} alt={pro.name || 'Staff Member'} />
                        ) : (
                          <div className="avatar-placeholder">
                            {getAvatarInitial(pro.name)}
                          </div>
                        )}
                      </div>
                      <div className="staff-details">
                        <h3 className="staff-name">{pro.name || 'Unnamed Staff'}</h3>
                        <p className="staff-role">{getRoleDisplay(pro.role)}</p>
                        <div className="staff-tags">
                          <span className="staff-tag gender-tag">
                            {getGenderDisplay(pro.gender)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service Availability - Middle */}
                    <div className="staff-services-info">
                      <div className="services-section">
                        <strong>Service Availability</strong>
                        <span className="service-tag">
                          {getServiceAvailabilityDisplay(pro.serviceAvailability)}
                        </span>
                      </div>
                    </div>

                    {/* Actions - Right Side */}
                    <div className="staff-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(pro)}
                        title="Edit staff member"
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(pro._id)}
                        disabled={loading}
                        title="Delete staff member"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Staff Popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h2>{editingProfessional ? "Edit Staff Member" : "Add New Staff Member"}</h2>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowPopup(false);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="popup-body">
                {/* Profile Image Upload */}
                <div className="form-group">
                  <label>Profile Image</label>
                  <div className="image-upload-area">
                    <div className="image-preview">
                      {profileImage ? (
                        <img src={URL.createObjectURL(profileImage)} alt="Preview" />
                      ) : editingProfessional?.image ? (
                        <img src={getImageUrl(editingProfessional)} alt={editingProfessional.name || 'Staff Member'} />
                      ) : (
                        <div className="image-placeholder">
                          <i className="fas fa-camera"></i>
                          <span>No image</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      onChange={handleProfileImageChange} 
                      accept="image/*"
                      disabled={loading}
                      id="profile-upload"
                    />
                    <label htmlFor="profile-upload" className="image-upload-label">
                      Choose Image
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Staff Name *</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter staff name" 
                    disabled={loading}
                    className={errors.name ? "error" : ""}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Staff Gender *</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                    disabled={loading}
                    className={errors.gender ? "error" : ""}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>

                <div className="form-group">
                  <label>Well Qualified?</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="wellQualified"
                        value="yes"
                        checked={formData.wellQualified === 'yes'}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="wellQualified"
                        value="no"
                        checked={formData.wellQualified === 'no'}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <span>No</span>
                    </label>
                  </div>
                  <small className="helper-text">
                    If selected, qualification document upload is mandatory
                  </small>
                </div>

                {formData.wellQualified === 'yes' && (
                  <div className="form-group">
                    <label>Upload Qualification Document *</label>
                    <div className="file-upload-area">
                      <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf,image/*"
                        disabled={loading}
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="file-upload-label">
                        {file ? file.name : "Upload PDF or image of qualifications"}
                      </label>
                    </div>
                    {errors.qualificationDoc && <span className="error-text">{errors.qualificationDoc}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label>Service Availability</label>
                  <div className="service-availability-buttons">
                    <button
                      type="button"
                      className={`availability-btn ${formData.serviceAvailability === 'male' ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, serviceAvailability: 'male'})}
                      disabled={loading}
                    >
                      Male Services
                    </button>
                    <button
                      type="button"
                      className={`availability-btn ${formData.serviceAvailability === 'female' ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, serviceAvailability: 'female'})}
                      disabled={loading}
                    >
                      Female Services
                    </button>
                    <button
                      type="button"
                      className={`availability-btn ${formData.serviceAvailability === 'both' ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, serviceAvailability: 'both'})}
                      disabled={loading}
                    >
                      Both
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowPopup(false);
                      resetForm();
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-staff-btn" 
                    onClick={handleAddOrUpdateProfessional}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : editingProfessional ? "Update Staff" : "Add Staff"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonProfessionalsV2;