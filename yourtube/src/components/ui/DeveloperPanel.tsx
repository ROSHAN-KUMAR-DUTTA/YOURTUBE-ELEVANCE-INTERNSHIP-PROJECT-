import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", 
  "Ladakh", "Chandigarh", "Puducherry", "Andaman & Nicobar Islands", "Lakshadweep", 
  "Dadra & Nagar Haveli and Daman & Diu"
];

const TIMES = ["08:00", "10:30", "11:45", "14:00", "20:00"];
const SOUTH_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

export default function DeveloperPanel() {
  const { 
    demoMode, setDemoMode, 
    demoState, setDemoState, 
    demoTime, setDemoTime, 
    theme, user, fetchAndApplyTheme
  } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [actualLocation, setActualLocation] = useState("Unknown");

  useEffect(() => {
    if (demoMode && demoState === "Auto Detect") {
      // Fetch actual IP location to display
      fetch("http://ip-api.com/json/")
        .then(res => res.json())
        .then(data => {
          if (data && data.regionName) {
            setActualLocation(data.regionName);
          }
        })
        .catch(() => setActualLocation("Unknown"));
    }
  }, [demoMode, demoState]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDemoTime(val);
    if (user) {
      fetchAndApplyTheme(user._id, val, demoMode);
    }
  };

  const handleDemoToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setDemoMode(isEnabled);
    if (user) {
      fetchAndApplyTheme(user._id, demoTime, isEnabled);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDemoState(val);
    if (user) {
      fetchAndApplyTheme(user._id, demoTime, demoMode, val);
    }
  };

  const activeState = demoMode && demoState !== "Auto Detect" ? demoState : (user?.state || actualLocation);
  const otpMethod = SOUTH_STATES.includes(activeState) ? "Email OTP" : "Mobile OTP";

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black text-white px-4 py-2 rounded-full shadow-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          {isOpen ? "Close Demo Panel" : "Open Demo Panel"}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 bg-black/90 text-green-400 p-6 rounded-lg shadow-2xl border border-green-500/30 w-80 font-mono text-sm backdrop-blur-md">
          <h3 className="text-white font-bold mb-4 pb-2 border-b border-gray-700 flex justify-between items-center">
            <span>DEVELOPER PANEL</span>
            <div className="flex items-center gap-2 text-xs font-normal">
              <label htmlFor="demo-toggle" className="cursor-pointer">Toggle:</label>
              <input 
                id="demo-toggle"
                type="checkbox" 
                checked={demoMode} 
                onChange={handleDemoToggle}
                className="cursor-pointer"
              />
            </div>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-[100px_1fr] items-center gap-2">
              <span className="text-gray-400">Demo Mode</span>
              <span className={demoMode ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                : {demoMode ? "ON" : "OFF"}
              </span>
            </div>

            {demoMode && (
              <>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-gray-400">Override Loc</span>
                  <select 
                    value={demoState}
                    onChange={handleStateChange}
                    className="bg-gray-900 border border-gray-700 text-green-400 rounded px-1 py-1 w-full outline-none"
                  >
                    <option value="Auto Detect">Auto Detect</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-gray-400">Override Time</span>
                  <select 
                    value={demoTime}
                    onChange={handleTimeChange}
                    className="bg-gray-900 border border-gray-700 text-green-400 rounded px-1 py-1 w-full outline-none"
                  >
                    <option value="Auto Time">Auto Time</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="border-t border-gray-700 my-4 pt-4 space-y-2">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">Detected State</span>
                <span className="truncate">: {user?.state || actualLocation}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">Simulated</span>
                <span className="truncate">: {demoMode && demoState !== "Auto Detect" ? demoState : "None"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">OTP Method</span>
                <span className="font-bold text-white">: {otpMethod}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">Current Time</span>
                <span>: {demoMode && demoTime !== "Auto Time" ? demoTime : "Real Time"}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">Current Theme</span>
                <span className="capitalize text-white font-bold">: {theme}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
