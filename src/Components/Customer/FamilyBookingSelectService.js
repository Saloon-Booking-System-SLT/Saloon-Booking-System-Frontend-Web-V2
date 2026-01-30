import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectServicesPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const SelectServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon } = location.state || {};

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");

  // ✅ updated based on your backend schema
  const isUnisex = salon?.salonType?.toLowerCase() === "unisex";

  const filterServices = useCallback((all, search, gender) => {
    let result = all.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isUnisex) {
      result = result.filter(
        (s) => s.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    setFilteredServices(result);
  }, [isUnisex]);

  useEffect(() => {
    if (!salon) return;
    fetch(`${API_BASE_URL}/api/services/${salon._id}`)
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        filterServices(data, searchQuery, selectedGender);
      })
      .catch((err) => {
        console.error("Failed to load services", err);
        alert("Failed to load services");
      });
  }, [salon, filterServices, searchQuery, selectedGender]);

  useEffect(() => {
    filterServices(services, searchQuery, selectedGender);
  }, [searchQuery, selectedGender, services, filterServices]);

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s._id)
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    if (selectedServices.length === 0) return alert("Please select a service");
    navigate(`/familybookingselectprofessional/${salon._id}`, {
      state: {
        salon,
        selectedServices,
      },
    });
  };

  return (
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb"><b>Services</b> &gt; Professional &gt; Time &gt; Confirm</p>

        <div className="heading-with-search">
          <h2>Select services</h2>
          <input
            type="text"
            className="service-search-input"
            placeholder="Search service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ✅ Show Gender Switch only for Unisex salons */}
        {isUnisex && (
          <div className="gender-switch">
            <button
              className={selectedGender === "Male" ? "active" : ""}
              onClick={() => setSelectedGender("Male")}
            >
              Male 👨‍🦱
            </button>
            <button
              className={selectedGender === "Female" ? "active" : ""}
              onClick={() => setSelectedGender("Female")}
            >
              Female 👩‍🦰
            </button>
          </div>
        )}

        <div className="select-services-list">
          {filteredServices.map((service) => (
            <div
              key={service._id}
              className={`select-services-card ${
                selectedServiceIds.includes(service._id) ? "selected" : ""
              }`}
              onClick={() => toggleService(service._id)}
            >
              <img
  src={
    service.image
      ? service.image.startsWith("http")
        ? service.image // already a full URL
        : `${API_BASE_URL}/uploads/${service.image}` // uploaded file
      : "https://via.placeholder.com/100"
  }
  alt={service.name}
  className="select-services-image"
/>

              <div className="select-services-details">
                <h4>{service.name}</h4>
                <p>{service.duration}</p>
                <p className="price">LKR {service.price}</p>
              </div>
              <div className="checkbox-icon">
                {selectedServiceIds.includes(service._id) ? "✔" : "☐"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
  src={
    salon?.image
      ? salon.image.startsWith("http")
        ? salon.image // already a full URL
        : `${API_BASE_URL}/uploads/${salon.image}` // uploaded file
      : "https://via.placeholder.com/150"
  }
  alt="Salon"
  className="salon-image"
/>

          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>

            {selectedServices.length === 0 ? (
              <p className="no-selection">No service selected</p>
            ) : (
              <ul className="selected-list">
                {selectedServices.map((s) => (
                  <li key={s._id}>
                    {s.name}
                    <span className="service-price">LKR {s.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="total-section">
            <p>Total</p>
            <p>
              <strong>
                {totalPrice === 0 ? "free" : `LKR ${totalPrice}`}
              </strong>
            </p>
          </div>
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={selectedServiceIds.length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectServicesPage;
