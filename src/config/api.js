// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://dpdlab1.slt.lk:8447/salon-api/api";

const getUploadsUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith("/api")
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, "/uploads")
      : `${process.env.REACT_APP_API_URL}/uploads`;
  }
  return "https://dpdlab1.slt.lk:8447/salon-api/api"; // keeping original fallback
};

export const UPLOADS_URL = getUploadsUrl();

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith("/api")
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, "")
      : process.env.REACT_APP_API_URL;
  }
  return "https://dpdlab1.slt.lk:8447/salon-api/";
};

export const BASE_URL = getBaseUrl();
