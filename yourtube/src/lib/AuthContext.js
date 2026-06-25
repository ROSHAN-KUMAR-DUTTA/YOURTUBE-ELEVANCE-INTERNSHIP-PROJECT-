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

  const fetchAndApplyTheme = async (userId) => {
    try {
      const res = await axiosInstance.get(`/api/theme/${userId}`);
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
    }

    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, theme, login, logout, handlegooglesignin, manualLogin, verifyOtp }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);