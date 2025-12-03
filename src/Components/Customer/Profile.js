import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

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

      const res = await fetch(`https://saloon-booking-system-backend-v2.onrender.com/api/users/favorites`, {
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

      const res = await fetch(`https://saloon-booking-system-backend-v2.onrender.com/api/users/favorites/${salonId}`, {
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
      const res = await fetch(`https://saloon-booking-system-backend-v2.onrender.com/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setEditPopup(false);
    } catch (err) {
      alert("Update failed");
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo"onClick={() => navigate("/")}>Salon</div>
        <div className="user-name">{user.name}</div>
        <nav>
          <button className="nav-btn active">👤 Profile</button>
          <button className="nav-btn" onClick={() => navigate("/appointments")}><CalendarDaysIcon className="h-4 w-4 inline mr-1" /> Appointments</button>
          <button className="nav-btn">❤️ Favorites</button>
          <button
            className="nav-btn logout"
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Log out
          </button>
        </nav>
      </aside>

      {/* Main Section */}
      <main className="main-content">
        <div className="profile-sections">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Profile</h2>
              <span className="edit-link" onClick={() => setEditPopup(true)}>Edit</span>
            </div>
            <div className="profile-info">
              <div className="animated-border"></div>
              <img
                src={user.photoURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EUser%3C/text%3E%3C/svg%3E"}
                alt="User"
                className="profile-pic"
              />
              <h3>{user.name}</h3>
              <p><strong>Email:</strong><br />{user.email}</p>
              <p><strong>Mobile:</strong><br />{user.phone || "N/A"}</p>
              <p><strong>Gender:</strong><br />{user.gender || "N/A"}</p>
            </div>
          </div>

          {/* Address Card */}
          <div className="address-card">
            <div className="card-header">
              <h2>My Addresses</h2>
            </div>
            {user.address && user.address.length > 0 ? (
              user.address.map((addr, i) => (
                <div className="address-box" key={i}>
                  <p><strong>{addr.type}</strong><br />
                    <span className="muted">{addr.text}</span></p>
                </div>
              ))
            ) : (
              <p className="muted">No address added yet.</p>
            )}
            <button className="add-btn" onClick={() => setAddressPopup(true)}>＋ Add Address</button>
          </div>

          {/* Favorites Card */}
          <div className="favorites-card">
            <div className="card-header">
              <h2>My Favorite Salons</h2>
            </div>
            {favoritesLoading ? (
              <p className="muted">Loading favorites...</p>
            ) : favorites.length > 0 ? (
              <div className="favorites-list">
                {favorites.map((salon) => (
                  <div className="favorite-item" key={salon._id}>
                    <img 
                      src={salon.image || "https://via.placeholder.com/60x60?text=Salon"} 
                      alt={salon.name}
                      className="favorite-salon-image"
                    />
                    <div className="favorite-info">
                      <h4>{salon.name}</h4>
                      <p className="favorite-location">{salon.location}</p>
                      <p className="favorite-type">{salon.salonType} Salon</p>
                    </div>
                    <div className="favorite-actions">
                      <button 
                        className="book-btn"
                        onClick={() => navigate(`/BookSelectionPage`, { state: { salon } })}
                      >
                        Book Now
                      </button>
                      <button 
                        className="remove-favorite-btn"
                        onClick={() => removeFavorite(salon._id)}
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-favorites">
                <p className="muted">You haven't added any favorite salons yet.</p>
                <button 
                  className="browse-btn" 
                  onClick={() => navigate("/searchsalon")}
                >
                  Browse Salons
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Popup */}
        {editPopup && (
          <div className="popup">
            <div className="popup-content">
              <h3>Edit Profile</h3>
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
              <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
              <input type="text" name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} />
              <button onClick={handleUpdateProfile}>Update</button>
              <button onClick={() => setEditPopup(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Add Address Popup */}
        {addressPopup && (
          <AddAddressPopup
            user={user}
            setUser={setUser}
            close={() => setAddressPopup(false)}
          />
        )}
      </main>
    </div>
  );
};

// Address Add Popup Component
const AddAddressPopup = ({ user, setUser, close }) => {
  const [type, setType] = useState("Home");
  const [text, setText] = useState("");

  const handleAdd = async () => {
    const updated = { ...user, address: [...(user.address || []), { type, text }] };

    try {
      const res = await fetch(`https://saloon-booking-system-backend-v2.onrender.com/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      close();
    } catch (err) {
      alert("Failed to add address");
    }
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h3>Add Address</h3>
        <input type="text" placeholder="Type (e.g., Home)" value={type} onChange={(e) => setType(e.target.value)} />
        <input type="text" placeholder="Address" value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={handleAdd}>Save</button>
        <button onClick={close}>Cancel</button>
      </div>
    </div>
  );
};

export default Profile;
