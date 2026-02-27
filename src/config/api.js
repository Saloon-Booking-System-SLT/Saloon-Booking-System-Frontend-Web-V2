// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL;

const getUploadsUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith("/api")
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, "/uploads")
      : `${process.env.REACT_APP_API_URL}/uploads`;
  }
  return "";
};

export const UPLOADS_URL = getUploadsUrl();

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith("/api")
      ? process.env.REACT_APP_API_URL.replace(/\/api$/, "")
      : process.env.REACT_APP_API_URL;
  }
  return "";
};

export const BASE_URL = getBaseUrl();
