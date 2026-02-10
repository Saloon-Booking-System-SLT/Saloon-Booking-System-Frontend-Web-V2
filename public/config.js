// Runtime configuration for production
window.APP_CONFIG = {
  BACKEND_URLS: [
    "https://dpdlab1.slt.lk:8447/salon-api/api",
    "https://saloon-booking-system-backend-v2.onrender.com/api",
    "https://salon-backend-production.railway.app/api",
    // Add more backup URLs as deployments are created
  ],
  ENVIRONMENT: "production",
  DEBUG: false
};