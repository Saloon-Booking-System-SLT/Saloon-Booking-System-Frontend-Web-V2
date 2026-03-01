import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../Api/axios";
import logo from "../../Assets/logo.png";
import maleIcon from "../../Assets/man.png";
import femaleIcon from "../../Assets/feee.png";
import "./SalonProfessionals.css";

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

  const Sidebar = () => {
    return (
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />

        <i
          className="fas fa-home"
          title="Home"
          onClick={() => navigate("/dashboard")}
        ></i>
        <i
          className="fas fa-calendar-alt"
          title="Calendar"
          onClick={() => navigate("/calendar")}
        ></i>
        <i
          className="fas fa-cut"
          title="Services"
          onClick={() => navigate("/services")}
        ></i>
        <i
          className="fas fa-comment"
          title="Feedbacks"
          onClick={() => navigate("/feedbacks")}
        ></i>
        <i className="fas fa-users active" title="Professionals"></i>
        <i
          className="fas fa-calendar-check"
          title="Book An Appointment"
          onClick={() => navigate("/book-appointment")}
        ></i>
        <i
          className="fas fa-clock"
          title="Time Slots"
          onClick={() => navigate("/timeslots")}
        ></i>
      </aside>
    );
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

      // Reset icon/upload when gender changes
      if (name === "gender") {
        updated.selectedIcon = "";
        setFileImage(null);
      }

      // Clear uploaded file when switching back to icon mode
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
    if (!window.confirm("Delete?")) return;

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
      if (typeof pro.image === "string" && pro.image.startsWith("data:image")) {
        return pro.image;
      }
      return `data:image/jpeg;base64,${pro.image}`;
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
    <div className="pro-v2-container">
      <Sidebar />

      <div className="pro-v2-main">
        <header className="pro-v2-header">
          <div className="pro-v2-header-content">
            <h1 className="pro-v2-header-title">Salon Professionals</h1>
            <div className="pro-v2-header-decoration"></div>
          </div>

          <button
            className="pro-v2-add-btn"
            onClick={() => {
              resetForm();
              setShowPopup(true);
            }}
          >
            Add Professional
          </button>
        </header>

        <div className="pro-v2-stats">
          <div className="pro-v2-stat-card">
            <div className="pro-v2-stat-icon total">
              <i className="fas fa-users"></i>
            </div>
            <div className="pro-v2-stat-copy">
              <span className="pro-v2-stat-label">Total Professionals</span>
              <span className="pro-v2-stat-value">{totalProfessionals}</span>
            </div>
          </div>

          <div className="pro-v2-stat-card">
            <div className="pro-v2-stat-icon male">
              <i className="fas fa-mars"></i>
            </div>
            <div className="pro-v2-stat-copy">
              <span className="pro-v2-stat-label">Male Specialists</span>
              <span className="pro-v2-stat-value">{maleCount}</span>
            </div>
          </div>

          <div className="pro-v2-stat-card">
            <div className="pro-v2-stat-icon female">
              <i className="fas fa-venus"></i>
            </div>
            <div className="pro-v2-stat-copy">
              <span className="pro-v2-stat-label">Female Specialists</span>
              <span className="pro-v2-stat-value">{femaleCount}</span>
            </div>
          </div>

          <div className="pro-v2-stat-card">
            <div className="pro-v2-stat-icon both">
              <i className="fas fa-user-friends"></i>
            </div>
            <div className="pro-v2-stat-copy">
              <span className="pro-v2-stat-label">Serving Both</span>
              <span className="pro-v2-stat-value">{bothAvailabilityCount}</span>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
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

        {error && <div className="error-banner">{error}</div>}

        <div className="pro-v2-grid">
          {loading ? (
            <div className="pro-v2-card skeleton">Loading professionals...</div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="pro-v2-card empty">No professionals found.</div>
          ) : (
            filteredProfessionals.map((pro) => {
              const genderBadgeClass =
                pro.gender === "Male"
                  ? "badge-male"
                  : pro.gender === "Female"
                  ? "badge-female"
                  : "badge-muted";

              const genderIconClass =
                pro.gender === "Male"
                  ? "fa-mars"
                  : pro.gender === "Female"
                  ? "fa-venus"
                  : "fa-user";

              const genderLabel = pro.gender || "Not specified";
              const serviceLabel = pro.service || "Service not set";
              const availabilityLabel = pro.serviceAvailability || "Not set";

              return (
                <div key={pro._id} className="pro-v2-card-enhanced">
                  <div className="pro-v2-card-header">
                    <div className="pro-v2-professional-avatar">
                      <div className="pro-v2-avatar-container">
                        <img
                          src={getProfessionalImage(pro)}
                          alt={pro.name}
                          className="pro-v2-avatar"
                        />
                        <div className="pro-v2-status-indicator active"></div>
                      </div>

                      <div className="pro-v2-rating-badge">
                        <i className="fas fa-star"></i>
                        <span>4.8</span>
                      </div>
                    </div>

                    <div className="pro-v2-header-info">
                      <h3 className="pro-v2-name">{pro.name}</h3>
                      <div className="pro-v2-title-row">
                        <span className="pro-v2-primary-service">
                          <i className="fas fa-scissors"></i>
                          {serviceLabel} Specialist
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pro-v2-professional-details">
                    <div className="pro-v2-detail-section">
                      <div className="pro-v2-detail-row">
                        <div className="pro-v2-detail-item">
                          <i
                            className={`fas ${genderIconClass} pro-v2-detail-icon`}
                          ></i>
                          <div className="pro-v2-detail-content">
                            <span className="pro-v2-detail-label">Gender</span>
                            <span
                              className={`pro-v2-detail-value ${genderBadgeClass}`}
                            >
                              {genderLabel}
                            </span>
                          </div>
                        </div>

                        <div className="pro-v2-detail-item">
                          <i className="fas fa-users pro-v2-detail-icon"></i>
                          <div className="pro-v2-detail-content">
                            <span className="pro-v2-detail-label">Serves</span>
                            <span className="pro-v2-detail-value badge-availability">
                              {availabilityLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pro-v2-certification-section">
                      {pro.certificate ? (
                        <div
                          className="pro-v2-cert-verified"
                          onClick={() => handleViewCertificate(pro.certificate)}
                        >
                          <div className="pro-v2-cert-icon">
                            <i className="fas fa-certificate"></i>
                          </div>
                          <div className="pro-v2-cert-info">
                            <span className="pro-v2-cert-title">
                              Verified Professional
                            </span>
                            <span className="pro-v2-cert-subtitle">
                              Certificate available
                            </span>
                          </div>
                          <i className="fas fa-external-link-alt pro-v2-cert-link"></i>
                        </div>
                      ) : (
                        <div className="pro-v2-cert-pending">
                          <div className="pro-v2-cert-icon">
                            <i className="fas fa-clock"></i>
                          </div>
                          <div className="pro-v2-cert-info">
                            <span className="pro-v2-cert-title">
                              Pending Verification
                            </span>
                            <span className="pro-v2-cert-subtitle">
                              Certificate not uploaded
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pro-v2-card-footer">
                    <div className="pro-v2-quick-stats">
                      <div className="pro-v2-stat">
                        <i className="fas fa-thumbs-up"></i>
                        <span>98% Rating</span>
                      </div>
                      <div className="pro-v2-stat">
                        <i className="fas fa-clock"></i>
                        <span>Available</span>
                      </div>
                    </div>

                    <div className="pro-v2-actions">
                      <button
                        className="pro-v2-action-btn pro-v2-edit-btn"
                        onClick={() => handleEdit(pro)}
                      >
                        <i className="fas fa-edit"></i>
                        Edit
                      </button>
                      <button
                        className="pro-v2-action-btn pro-v2-delete-btn"
                        onClick={() => handleDelete(pro._id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showPopup && (
        <div className="pro-v2-popup-overlay">
          <div className="pro-v2-popup">
            <div className="pro-v2-popup-header">
              <h2>{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>
              <p className="pro-v2-popup-subtitle">
                Keep your salon roster vibrant by sharing a few quick details.
              </p>
            </div>

            <div className="pro-v2-form-grid">
              <div className="pro-v2-field">
                <label htmlFor="pro-name">Professional Name</label>
                <input
                  id="pro-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInput}
                  placeholder="E.g. Alex Perera"
                />
              </div>

              <div className="pro-v2-field">
                <label htmlFor="pro-service">Primary Service</label>
                <input
                  id="pro-service"
                  name="service"
                  value={formData.service}
                  onChange={handleInput}
                  placeholder="E.g. Hair Coloring"
                />
              </div>

              <div className="pro-v2-field">
                <label htmlFor="pro-availability">Service Availability</label>
                <select
                  id="pro-availability"
                  name="serviceAvailability"
                  value={formData.serviceAvailability}
                  onChange={handleInput}
                >
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="pro-v2-field pro-v2-field--full">
                <div className="gender-icon-section">
                  <span className="pro-v2-section-title">Select Gender</span>
                  <div className="gender-options">
                    <label
                      className={`gender-card ${
                        formData.gender === "Male" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === "Male"}
                        onChange={handleInput}
                      />
                      <img src={maleIcon} alt="Male" className="gender-icon" />
                      <span>Male</span>
                    </label>

                    <label
                      className={`gender-card ${
                        formData.gender === "Female" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === "Female"}
                        onChange={handleInput}
                      />
                      <img src={femaleIcon} alt="Female" className="gender-icon" />
                      <span>Female</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pro-v2-field pro-v2-field--full">
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
              </div>

              <div className="pro-v2-field pro-v2-field--full">
                {formData.imageType === "icon" ? (
                  <div className="icon-selection">
                    {formData.gender ? (
                      <>
                        <label>Select a {formData.gender} Icon:</label>
                        <div className="icon-grid">
                          {genderIcons[formData.gender]?.map((iconUrl, index) => (
                            <div
                              key={index}
                              className={`icon-option ${
                                formData.selectedIcon === iconUrl ? "selected" : ""
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  selectedIcon: iconUrl,
                                }))
                              }
                            >
                              <img
                                src={iconUrl}
                                alt={`${formData.gender} icon ${index + 1}`}
                              />
                              {formData.selectedIcon === iconUrl && (
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
                    <label htmlFor="pro-image">Upload Custom Image</label>
                    <input
                      id="pro-image"
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
              </div>

              <div className="pro-v2-field pro-v2-field--full">
                <label htmlFor="pro-certificate">Upload Certificate (optional)</label>
                <div className="pro-v2-file-input">
                  <input
                    id="pro-certificate"
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
                  <span className="pro-v2-field-note">
                    Certificates build client trust and highlight professional
                    expertise.
                  </span>
                </div>
              </div>
            </div>

            <div className="pro-v2-popup-actions">
              <button className="pro-v2-save-btn" onClick={handleAddOrUpdate}>
                <i className="fas fa-save"></i>
                {editingProfessional ? "Update" : "Add"} Professional
              </button>

              <button
                className="pro-v2-cancel-btn"
                onClick={() => {
                  setShowPopup(false);
                  resetForm();
                }}
              >
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