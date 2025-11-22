# Salon Booking System - Frontend

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-9.x-orange.svg)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://vercel.com/)

A modern, responsive web application for salon and spa booking management. Built with React.js, featuring a comprehensive booking system, multi-role dashboards, and seamless user experience across all devices.

## Features

### **Multi-Role User System**
- **Customer Dashboard**: Book appointments, manage profiles, view history
- **Salon Owner Dashboard**: Manage services, staff, appointments, and analytics  
- **Admin Panel**: System-wide management, analytics, and oversight

### **Customer Experience**
- Advanced salon search with location-based filtering
- Real-time availability checking
- Service browsing with detailed descriptions
- Professional selection with ratings
- Secure payment processing via Stripe
- Appointment history and management
- Family booking for group appointments
- Review and rating system

### **Salon Owner Features**
- Complete business profile management
- Service catalog management with pricing
- Staff/professional management
- Time slot and availability control
- Real-time appointment calendar
- Customer feedback monitoring
- Revenue analytics and reporting
- Image gallery management

### **Admin Capabilities**
- System-wide analytics dashboard
- User and salon management
- Financial insights and reporting
- Feedback moderation
- Loyalty program management
- Promotion and discount control

### **Technical Features**
- Responsive design for all devices
- Real-time data synchronization
- Progressive Web App (PWA) capabilities
- Firebase authentication integration
- Secure API communication
- Image optimization and lazy loading
- Dark/Light mode support
- Offline functionality

## Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React.js** | Frontend Framework | 18.x |
| **Tailwind CSS** | Styling Framework | 3.x |
| **Firebase** | Authentication | 9.x |
| **Axios** | HTTP Client | Latest |
| **React Router** | Navigation | 6.x |
| **Day.js** | Date Management | Latest |
| **React Query** | State Management | Latest |
| **Framer Motion** | Animations | Latest |
| **React Hook Form** | Form Management | Latest |

## Live Demo

**Website**: https://saloon-booking-system-frontend-web-eight.vercel.app

### **Try Different Roles**
- **Customer**: Register and explore salon booking
- **Salon Owner**: Manage your salon business
- **Admin**: Access administrative features

## Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── index.html               # Main HTML template
│   ├── manifest.json            # PWA manifest
│   └── robots.txt               # SEO robots
├── src/
│   ├── Components/           # React components
│   │   ├── Admin/           # Admin dashboard components
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── CalendarPage.js
│   │   │   ├── CustomersPage.js
│   │   │   ├── FinancialInsights.js
│   │   │   ├── LoyaltyPage.js
│   │   │   ├── PromotionsPage.js
│   │   │   ├── ReportsPage.js
│   │   │   └── SalonsManagement.js
│   │   ├── Customer/        # Customer-facing components
│   │   │   ├── HomePage.jsx
│   │   │   ├── searchsalon.js
│   │   │   ├── Login.js
│   │   │   ├── Profile.js
│   │   │   ├── BookSelectionPage.js
│   │   │   ├── CheckoutPage.js
│   │   │   ├── Payment.js
│   │   │   ├── MyAppointmentsPage.js
│   │   │   ├── FamilyBooking.js
│   │   │   └── ConfirmationPage.js
│   │   ├── Owner/           # Salon owner components
│   │   │   ├── ModernDashboard.js
│   │   │   ├── SalonCalendar.js
│   │   │   ├── SalonServices.js
│   │   │   ├── SalonProfessionals.js
│   │   │   ├── SalonTimeSlots.js
│   │   │   ├── OwnerFeedbackPage.js
│   │   │   ├── BusinessSetupWizard.js
│   │   │   └── ProfileModal.js
│   │   ├── Common/          # Shared components
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── Modal.js
│   │   └── Auth/            # Authentication components
│   │       ├── AdminRoute.js
│   │       ├── CustomerRoute.js
│   │       ├── OwnerRoute.js
│   │       └── ProtectedRoute.js
│   ├── contexts/             # React contexts
│   │   └── AuthContext.js       # Authentication context
│   ├── services/             # API services
│   │   └── api.js              # API configuration
│   ├── Utils/               # Utility functions
│   │   └── slotUtils.js        # Time slot utilities
│   ├── Assets/              # Images and static files
│   ├── Api/                 # API configuration
│   │   └── axios.js            # Axios setup
│   ├── firebase.js             # Firebase configuration
│   ├── App.js                  # Main App component
│   ├── index.js                # React DOM render
│   └── index.css               # Global styles
├── .env.production              # Production environment variables
├── .env.example                 # Environment template
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── vercel.json                  # Vercel deployment config
└── package.json                 # Dependencies and scripts
```

## Quick Start

### Prerequisites
- Node.js (≥16.0.0)
- npm (≥7.0.0)
- Firebase project setup

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Saloon-Booking-System-SLT/Saloon-Booking-System-Frontend-Web-V2.git
cd Saloon-Booking-System-Frontend-Web-V2
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
# API Configuration
REACT_APP_API_URL=https://saloon-booking-system-backend-v2.onrender.com/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. **Start the development server**
```bash
npm start
```

The app will open at `http://localhost:3000`

## Design System

### **Color Palette**
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Neutral**: Gray scales

### **Responsive Breakpoints**
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### **Component Library**
- Modern card-based layouts
- Smooth animations and transitions
- Accessible form controls
- Interactive buttons and icons
- Loading states and skeletons

## Available Scripts

```bash
# Development
npm start              # Start development server
npm run dev            # Start with hot reload

# Building
npm run build          # Create production build
npm run preview        # Preview production build

# Testing
npm test               # Run test suite
npm run test:coverage  # Run tests with coverage

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run format         # Format code with Prettier

# Deployment
npm run deploy         # Deploy to Vercel
```

## PWA Features

- **Offline Support**: Basic functionality works offline
- **Install Prompt**: Can be installed on devices
- **Push Notifications**: Appointment reminders
- **Background Sync**: Data synchronization
- **Fast Loading**: Optimized performance

## Performance Optimizations

- **Code Splitting**: Lazy loading for route components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Service worker for static assets
- **Analytics**: Performance monitoring
- **Core Web Vitals**: Optimized for Google metrics

## Testing

Run the test suite:
```bash
npm test
```

Test coverage:
```bash
npm run test:coverage
```

E2E testing:
```bash
npm run test:e2e
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Connect GitHub repository to Vercel**
2. **Configure build settings:**
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`
3. **Add environment variables**
4. **Deploy automatically on push**

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## Security Features

- **Firebase Authentication** with secure token handling
- **Protected Routes** based on user roles
- **XSS Protection** with input sanitization
- **Form Validation** with client-side checks
- **API Security** with token validation
- **Environment Security** with secure variable handling

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ≥90 |
| Firefox | ≥88 |
| Safari | ≥14 |
| Edge | ≥90 |
| iOS Safari | ≥14 |
| Android Chrome | ≥90 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
