import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [credit, setCredit] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
        headers: { token },
      });
      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      } else {
        toast.error(data.message || "Failed to load credits.");
      }
    } catch (error) {
      console.error("Error loading credits:", error);
      toast.error("Error fetching credits data.");
    }
  };

  const generateImage = async (prompt) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/image/generate-image`,
        { prompt, userId: user?.id },
        { headers: { token } }
      );
      if (data.success) {
        await loadCreditsData();
        return data.resultImage;
      } else {
        toast.error(data.message || "Image generation failed.");
        await loadCreditsData();
        if (data.creditBalance === 0) navigate("/buy");
        return null;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error generating image.");
      return null;
    }
  };

  const generateImageToImage = async (inputImage, styleImage, prompt, param1, param2) => {
    try {
      const formData = new FormData();
      formData.append("userId", user?.id);
      formData.append("prompt", prompt);
      formData.append("structure_image", inputImage);
      if (styleImage && typeof styleImage !== "string") {
        formData.append("style_image", styleImage);
      }
      formData.append("depth_strength", param1);
      formData.append("style_strength", param2);

      const { data } = await axios.post(
        `${backendUrl}/api/image/generate-image-to-image`,
        formData,
        { headers: { token } }
      );

      if (data.success) {
        await loadCreditsData();
        return data.resultImage;
      } else {
        toast.error(data.message || "Image-to-image generation failed.");
        await loadCreditsData();
        if (data.creditBalance === 0) navigate("/buy");
        return null;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error in image-to-image generation.");
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCredit(0);
  };

  useEffect(() => {
    if (token) loadCreditsData();
  }, [token]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage,
    generateImageToImage,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;
