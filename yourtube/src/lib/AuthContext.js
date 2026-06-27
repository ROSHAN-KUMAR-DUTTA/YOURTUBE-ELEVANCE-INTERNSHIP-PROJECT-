import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [theme, setTheme] = useState("dark");

  // DEMO MODE STATES
  const [demoMode, setDemoMode] = useState(false);
  const [demoState, setDemoState] = useState("Auto Detect");
  const [demoTime, setDemoTime] = useState("Auto Time");

  const fetchAndApplyTheme = async (userId, customTime = demoTime, isDemo = demoMode, customState = demoState) => {
    try {
      let url = `/api/theme/${userId}?`;
      if (isDemo) {
        if (customTime !== "Auto Time") {
          const hourMatch = customTime.match(/^(\d{2})/);
          if (hourMatch) url += `simulatedHour=${hourMatch[1]}&`;
        }
        if (customState !== "Auto Detect") {
          url += `simulatedState=${encodeURIComponent(customState)}&`;
        }
      }
      const res = await axiosInstance.get(url);
      const fetchedTheme = res.data.theme || "dark";
      setTheme(fetchedTheme);
      if (fetchedTheme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    } catch (error) {
      console.error("Theme fetch error", error);
    }
  };

  const login = (userdata, token) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    if (token) localStorage.setItem("token", token);
    fetchAndApplyTheme(userdata._id);
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      login(response.data.result, response.data.token);
    } catch (error) {
      console.error(error);
    }
  };

  const manualLogin = async (payload) => {
    if (demoMode && demoState !== "Auto Detect") {
      payload.simulatedState = demoState;
    }
    const res = await axiosInstance.post("/user/login-manual", payload);
    return res.data;
  };

  const verifyOtp = async (userId, otp) => {
    const res = await axiosInstance.post("/user/verify-otp", { userId, otp });
    login(res.data.result, res.data.token);
    return res.data.result;
  };
  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          login(response.data.result, response.data.token);
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchAndApplyTheme(parsedUser._id);
      
      // Fetch latest user data dynamically to avoid stale state (e.g. current plan updates)
      axiosInstance.get(`/user/${parsedUser._id}`).then(res => {
  if (res.data) {
    setUser(res.data);
    localStorage.setItem("user", JSON.stringify(res.data));
  }
}).catch(err => {
  console.error("Failed to refresh user profile:", err);
  if (err.response?.status === 404) {
    // Stale user in localStorage — clear it, Firebase will re-authenticate
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  }
});
    }

    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, setUser, theme, login, logout, handlegooglesignin, manualLogin, verifyOtp,
      demoMode, setDemoMode, demoState, setDemoState, demoTime, setDemoTime, fetchAndApplyTheme 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);