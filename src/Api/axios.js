import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api", // Backend shared base URL
  withCredentials: true,
});

export default instance;
