import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [credit, setCredit] = useState(0);
  const [isCreditsLoading, setIsCreditsLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const location = useLocation();

  // Define routes that require credits
  const creditRequiringPaths = ["/generate", "/image-to-image"];

  const loadCreditsData = async () => {
    try {
      setIsCreditsLoading(true);
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
    } finally {
      setIsCreditsLoading(false);
    }
  };

  const generateImage = async (prompt) => {
    if (credit <= 0) {
      toast.warn("Insufficient credits.");
      navigate("/buy");
      return null;
    }
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
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error generating image.";
      toast.error(errorMessage);
      if (errorMessage.includes("Insufficient credits")) {
        navigate("/buy");
      }
      await loadCreditsData();
      return null;
    }
  };

  const generateImageToImage = async (inputImage, styleImage, prompt, param1, param2) => {
    if (credit <= 0) {
      toast.warn("Insufficient credits. Redirecting to buy credits.");
      navigate("/buy");
      return null;
    }
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
        { headers: { token, "Content-Type": "multipart/form-data" } }
      );

      if (data.success) {
        await loadCreditsData();
        return data.resultImage;
      } else {
        toast.error(data.message || "Image-to-image generation failed.");
        await loadCreditsData();
        return null;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error in image-to-image generation.";
      toast.error(errorMessage);
      if (errorMessage.includes("Insufficient credits")) {
        navigate("/buy");
      }
      await loadCreditsData();
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCredit(0);
  };

  // Load credits when token changes
  useEffect(() => {
    if (token) {
      loadCreditsData();
    }
  }, [token]);

  // Redirect to "/buy" when credits are zero on credit-requiring pages
  useEffect(() => {
    if (
      token &&
      !isCreditsLoading &&
      credit === 0 &&
      creditRequiringPaths.includes(location.pathname)
    ) {
      toast.warn("You have no credits left. Redirecting to buy credits.");
      navigate("/buy");
    }
  }, [location.pathname, isCreditsLoading, credit, token]);

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
