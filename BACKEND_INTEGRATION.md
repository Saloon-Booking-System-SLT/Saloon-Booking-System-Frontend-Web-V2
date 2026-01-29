# Revenue Report - Backend Integration Guide

## Overview
The Revenue Report component requires backend endpoints to fetch appointment and payment data. This guide explains how to set up the necessary backend infrastructure.

## Required Backend Endpoints

### 1. **GET /api/appointments/salon/{salonId}**

This is the main endpoint that fetches all appointments for a salon.

**Request:**
```
GET https://your-backend.com/api/appointments/salon/123456
Headers:
  Authorization: Bearer {token}
```

**Response Format:**
```json
[
  {
    "_id": "apt_001",
    "salonId": "123456",
    "userId": "user_123",
    "date": "2024-01-26",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "confirmed",
    "paymentStatus": "success",
    "paymentMethod": "Credit Card",
    "price": 2500,
    "serviceName": "Hair Cut",
    "services": [
      {
        "_id": "srv_001",
        "name": "Hair Cut",
        "price": 2500,
        "duration": "1 hour"
      }
    ],
    "user": {
      "_id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+94123456789"
    },
    "professional": {
      "_id": "prof_001",
      "name": "Jane Smith"
    },
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-26T10:00:00Z"
  },
  // ... more appointments
]
```

**Required Fields in Response:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | String | Yes | Appointment ID |
| date | String (YYYY-MM-DD) | Yes | Appointment date |
| status | String | Yes | "confirmed", "completed", "pending", "cancelled" |
| paymentStatus | String | Yes | "success", "pending", "failed" |
| paymentMethod | String | No | Payment method used |
| price | Number | Yes | Appointment price in LKR |
| serviceName | String | Yes | Name of the service |
| services[].name | String | Yes | Service name (fallback) |
| services[].price | Number | Yes | Service price (fallback) |
| createdAt | Date | No | Creation timestamp |

## Frontend API Call

The component calls the backend in `fetchRevenueData()`:

```javascript
const appointmentsRes = await axios.get(
  `${API_BASE_URL}/appointments/salon/${salonData.id}`
);
```

**Where:**
- `API_BASE_URL` = `process.env.REACT_APP_API_URL` (default: `https://saloon-booking-system-backend-v2.onrender.com/api`)
- `salonData.id` = Salon ID from `localStorage.getItem('salonUser')`

## Environment Setup

### 1. Create `.env` file in frontend root:
```
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_ENV=production
```

### 2. Verify Backend URL
```javascript
// RevenueReport.js line 17
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'https://saloon-booking-system-backend-v2.onrender.com/api';
```

## Backend Implementation Example (Node.js/Express)

### Route Definition
```javascript
// routes/appointments.js
router.get('/appointments/salon/:salonId', authenticateToken, async (req, res) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate } = req.query;

    // Build query
    let query = { salonId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Fetch appointments with populated references
    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone')
      .populate('professionalId', 'name')
      .populate('services', 'name price duration')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### Database Schema (MongoDB)
```javascript
// models/Appointment.js
const appointmentSchema = new mongoose.Schema({
  salonId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    index: true
  },
  startTime: String,
  endTime: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'],
    default: 'Unknown'
  },
  price: Number,
  serviceName: String,
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

## Testing the Integration

### 1. Test API Endpoint
```bash
curl -X GET "http://localhost:5000/api/appointments/salon/123456" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

### 2. Browser Console Test
```javascript
// In browser console after logging in as owner
const salonId = JSON.parse(localStorage.getItem('salonUser')).id;
const API = 'https://saloon-booking-system-backend-v2.onrender.com/api';

fetch(`${API}/appointments/salon/${salonId}`)
  .then(res => res.json())
  .then(data => console.log('Appointments:', data))
  .catch(err => console.error('Error:', err));
```

### 3. Frontend Console Check
After loading Revenue Report page, check:
1. Network tab - should see successful API call
2. Console - check for error messages
3. Data display - metrics should populate

## Data Calculations (All Client-Side)

The component processes data locally:

```javascript
// 1. Filter by confirmed/completed status
filteredAppointments.filter(apt => 
  apt.status === 'confirmed' || apt.status === 'completed'
)

// 2. Calculate daily revenue
const dayKey = dayjs(apt.date).format('YYYY-MM-DD');
dailyRevenueMap[dayKey] = (dailyRevenueMap[dayKey] || 0) + price;

// 3. Calculate pending payments
filteredAppointments.filter(apt => 
  apt.status === 'pending' || apt.paymentStatus === 'pending'
)

// 4. Track payment methods
const method = apt.paymentMethod || 'Unknown';
paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1;

// 5. Service performance
const serviceName = apt.serviceName || apt.services?.[0]?.name;
servicesMap[serviceName] = {
  count: (servicesMap[serviceName]?.count || 0) + 1,
  revenue: (servicesMap[serviceName]?.revenue || 0) + price
};
```

## Common Issues & Solutions

### Issue 1: "Salon information not found"
**Cause:** `localStorage.getItem('salonUser')` is null
**Solution:**
```javascript
// Ensure salonUser is stored after owner login
localStorage.setItem('salonUser', JSON.stringify({
  id: salonId,
  name: salonName,
  // ... other salon data
}));
```

### Issue 2: CORS Errors
**Cause:** Backend not allowing frontend domain
**Solution (Express):**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true
}));
```

### Issue 3: No Data Displays
**Cause:** API returning empty array or wrong format
**Solution:**
1. Check API response in Network tab
2. Verify data structure matches schema above
3. Check date format (must be YYYY-MM-DD)
4. Verify salonId is correct

### Issue 4: Authentication Errors (401/403)
**Cause:** Missing or invalid authorization token
**Solution:**
```javascript
// Use axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Performance Optimization

### 1. Add Indexes to Database
```javascript
// MongoDB
db.appointments.createIndex({ salonId: 1, date: 1 })
db.appointments.createIndex({ status: 1 })
db.appointments.createIndex({ paymentStatus: 1 })
```

### 2. Implement Server-Side Filtering (Optional)
```javascript
// Better: Filter on backend instead of client
GET /api/appointments/salon/{salonId}?startDate=2024-01-01&endDate=2024-01-31&status=confirmed
```

### 3. Cache Results
```javascript
// Add caching to reduce API calls
GET /api/revenue-summary/salon/{salonId}?startDate=...&endDate=...

// Response
{
  totalRevenue: 25000,
  completedBookings: 10,
  pendingPayments: 5000,
  dailyBreakdown: [...],
  // Pre-calculated on backend
}
```

## Deployment Checklist

- [ ] Backend API endpoints are deployed and accessible
- [ ] CORS is properly configured
- [ ] Database has proper indexes on `salonId`, `date`, `status`
- [ ] `.env` file points to correct API URL
- [ ] Authentication tokens are being sent correctly
- [ ] Appointment data includes all required fields
- [ ] Date formats are consistent (YYYY-MM-DD)
- [ ] API response time is under 2 seconds
- [ ] Error handling is implemented on both frontend and backend

## Testing Data

To test the Revenue Report, ensure your backend has appointments with:

```javascript
[
  {
    salonId: "test-salon-123",
    date: "2024-01-26",
    status: "confirmed",
    paymentStatus: "success",
    paymentMethod: "Credit Card",
    price: 2500,
    serviceName: "Hair Cut"
  },
  {
    salonId: "test-salon-123",
    date: "2024-01-26",
    status: "confirmed",
    paymentStatus: "success",
    paymentMethod: "Bank Transfer",
    price: 3500,
    serviceName: "Hair Color"
  }
  // ... more test data
]
```

## Next Steps

1. Verify backend is returning data in correct format
2. Test API endpoint with curl/Postman
3. Check frontend console for errors
4. Validate data displays correctly
5. Optimize performance if needed
6. Deploy to production
