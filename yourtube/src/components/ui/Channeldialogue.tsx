import { useRouter } from "next/router";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Input } from "./input";
import { Label } from "./label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Textarea } from "./textarea";
import { Button } from "./button";

const Channeldialogue = ({ isopen, onclose, channeldata, mode }: any) => {
  const { user, login } = useUser();
  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setisSubmitting] = useState(false);
  useEffect(() => {
    if (channeldata && mode === "edit") {
      setFormData({
        name: channeldata.name || "",
        description: channeldata.description || "",
      });
    } else {
      setFormData({
        name: user?.name || "",
        description: "",
      });
    }
  }, [channeldata]);
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handlesubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    
    setisSubmitting(true);
    try {
      const payload = {
        channelname: formData.name,
        description: formData.description,
      };
      const response = await axiosInstance.patch(
        `/user/update/${user._id}`,
        payload
      );
      login(response?.data);
      onclose();
      router.push(`/channel/${user._id}`);
      setFormData({
        name: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating channel:", error);
    } finally {
      setisSubmitting(false);
    }
  };
  return (
    <Dialog open={isopen} onOpenChange={onclose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create your channel" : "Edit your channel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handlesubmit} className="space-y-6">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          {/* Channel Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Channel Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell viewers about your channel..."
            />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" className="bg-white text-black border border-gray-300 hover:bg-gray-100" onClick={onclose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Channel"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Channeldialogue;