"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    CustomSubstackWidget?: any;
  }
}

const SubstackEmbed = () => {
  useEffect(() => {
    window.CustomSubstackWidget = {
      substackUrl: "https://cornarolabs.substack.com",
      placeholder: "Your Email",
      buttonText: "Subscribe",
      theme: "custom",
      colors: {
        primary: "#253B6E",
        input: "#FFFFFF",
        email: "#000000",
        text: "#EAEAEA",
      },
    };

    const script = document.createElement("script");
    script.src = "https://substackapi.com/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-[#121C38] border border-[#1F2A50] rounded-xl shadow-lg w-full p-4">
      <div className="mb-3 flex flex-col gap-3 text-center lg:text-left">
        <h3 className="text-xl font-semibold text-[#EAEAEA]">Stay Updated!</h3>
        <p className="text-sm text-[#A1B1E1]">
          Subscribe to our newsletter for updates on Web3 grants.
        </p>
      </div>
      <div id="custom-substack-embed" className="w-full flex justify-center"></div>
    </div>
  );
};

export default SubstackEmbed;
