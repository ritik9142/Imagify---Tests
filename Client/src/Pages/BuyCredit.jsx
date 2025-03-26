import React, { useContext } from "react";
import { assets, plans } from "../assets/assets";
import { AppContext } from "../Context/AppContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const BuyCredit = () => {
  const { user, backendUrl, loadCreditsData, token, setShowLogin } =
    useContext(AppContext);
  const navigate = useNavigate();

  // Log the Razorpay key from env to verify it's loaded correctly.
  console.log("Client Razorpay Key:", import.meta.env.VITE_RAZORPAY_KEY_ID);

  const initPay = async (order) => {
    console.log("initPay called with order:", order);
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount, // amount in smallest currency unit (e.g., paise for INR)
      currency: order.currency,
      name: "Credits Payment",
      description: "Credits Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          // Call backend to verify the payment
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-razor`,
            response,
            { headers: { token } }
          );
          if (data.success) {
            loadCreditsData();
            navigate("/");
            toast.success("Credit Added");
          } else {
            toast.error(data.message || "Verification failed");
          }
        } catch (error) {
          toast.error("Verification error: " + error.message);
        }
      },
      prefill: {
        // Optionally prefill with user data if available
        name: user ? user.name : "",
        email: user ? user.email : "",
      },
    };

    console.log("Checking if Razorpay script is loaded:", window.Razorpay);
    if (!window.Razorpay) {
      console.error(
        "Razorpay script not loaded. Please check your index.html script tag."
      );
      toast.error("Razorpay script not loaded.");
      return;
    }

    try {
      const rzp = new window.Razorpay(options);
      console.log("Opening Razorpay checkout...");
      rzp.open();
    } catch (err) {
      console.error("Error opening Razorpay checkout:", err);
      toast.error("Error opening payment gateway.");
    }
  };

  const paymentRazorpay = async (planId) => {
    console.log("Purchase button clicked for planId:", planId);
    try {
      if (!user) {
        console.log("User not logged in. Prompting login.");
        setShowLogin(true);
        return;
      }

      console.log(`Sending request to: ${backendUrl}/api/user/pay-razor`);
      const { data } = await axios.post(
        `${backendUrl}/api/user/pay-razor`,
        { planId },
        { headers: { token } }
      );
      console.log("Backend order response:", data);

      if (data.success && data.order) {
        initPay(data.order);
      } else {
        toast.error("Order creation failed: " + data.message);
      }
    } catch (error) {
      console.error("paymentRazorpay error:", error);
      toast.error("Error initiating payment: " + error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="min-h-[80vh] text-center pt-14 mb-10"
    >
      <button
        className="border border-gray-400 px-10 py-2 rounded-full mb-6"
        onClick={() => console.log("Our Plans button clicked")}
      >
        Our Plans
      </button>
      <h1 className="text-center text-3xl font-medium mb-6 sm:mb-10">
        Choose the plan
      </h1>
      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500"
          >
            <img width={40} src={assets.logo_icon} alt="Logo Icon" />
            <p className="mt-3 mb-1 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">₹{item.price}</span> /{" "}
              {item.credits} credits
            </p>
            <button
              onClick={() => {
                console.log(`Purchase clicked for plan: ${item.id}`);
                paymentRazorpay(item.id);
              }}
              className="w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52"
            >
              {user ? "Purchase" : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BuyCredit;
