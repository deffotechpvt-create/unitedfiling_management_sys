import axios from "axios";
export const getBaseURL = () => {
    if (process.env.NODE_ENV === "production") {
        return process.env.NEXT_PUBLIC_API_BASE;
    } else {
        return "http://localhost:5000/api";
    }
};

const base = getBaseURL();
console.log("AXIOS BASE URL =", base);

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
