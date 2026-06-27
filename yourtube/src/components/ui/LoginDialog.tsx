import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { useUser } from "@/lib/AuthContext";
import { User as UserIcon } from "lucide-react";

const STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Other"
];

const LoginDialog = ({ isopen, onclose, initialMode = "signin" }: { isopen: boolean; onclose: () => void; initialMode?: "signin" | "signup" }) => {
  const { manualLogin, verifyOtp, handlegooglesignin } = useUser();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isopen) {
      setMode(initialMode);
      setStep("details");
    }
  }, [isopen, initialMode]);
  
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
          <DialogTitle>{step === "details" ? (mode === "signin" ? "Sign In" : "Create Account") : "Verify OTP"}</DialogTitle>
        </DialogHeader>

        {step === "details" ? (
          <div className="space-y-4 mt-4">
            <Button
              className="w-full flex items-center justify-center gap-2 mb-4"
              variant="outline"
              onClick={handlegooglesignin}
            >
              <UserIcon className="w-4 h-4" />
              Sign in with Google
            </Button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">Or continue with email</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input required type="password" name="password" value={formData.password} onChange={handleChange} />
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required name="name" value={formData.name} onChange={handleChange} />
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
                </>
              )}
              
              <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending OTP..." : "Continue"}</Button>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  {mode === "signin" ? (
                    <>Don't have an account? <span className="text-primary cursor-pointer hover:underline" onClick={() => setMode("signup")}>Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="text-primary cursor-pointer hover:underline" onClick={() => setMode("signin")}>Sign in</span></>
                  )}
                </div>
              </DialogFooter>
            </form>
          </div>
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
              <Button type="button" variant="outline" onClick={() => setStep("details")}>Back</Button>
              <Button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Login"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
