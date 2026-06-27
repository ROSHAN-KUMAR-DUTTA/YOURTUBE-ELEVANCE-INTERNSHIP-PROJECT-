import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://yourtube-elevance-internship-project.onrender.com",
});
export default axiosInstance;