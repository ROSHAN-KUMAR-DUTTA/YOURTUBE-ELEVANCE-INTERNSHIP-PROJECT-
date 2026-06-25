import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { useUser } from "@/lib/AuthContext";

const STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Other"
];

const LoginDialog = ({ isopen, onclose }: { isopen: boolean; onclose: () => void }) => {
  const { manualLogin, verifyOtp } = useUser();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    state: "Tamil Nadu",
  });
  
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [method, setMethod] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await manualLogin(formData);
      if (res.userId) {
        setUserId(res.userId);
        setMethod(res.method);
        setStep("otp");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(userId, otp);
      onclose();
      setStep("details");
      setFormData({ name: "", email: "", password: "", mobile: "", state: "Tamil Nadu" });
      setOtp("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "details" ? "Sign In / Register" : "Verify OTP"}</DialogTitle>
        </DialogHeader>

        {step === "details" ? (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input required type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input required type="password" name="password" value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Full Name (if new user)</Label>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input required name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <select 
                required 
                name="state" 
                value={formData.state} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background"
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>{loading ? "Sending OTP..." : "Continue"}</Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4 mt-4">
            <div className="bg-muted p-3 rounded text-sm mb-4">
              OTP has been sent via <strong>{method === "email" ? "Email" : "SMS"}</strong>.
            </div>
            <div className="space-y-2">
              <Label>Enter 6-digit OTP</Label>
              <Input required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" className="bg-white text-black border border-gray-300 hover:bg-gray-100" onClick={() => setStep("details")}>Back</Button>
              <Button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Login"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
