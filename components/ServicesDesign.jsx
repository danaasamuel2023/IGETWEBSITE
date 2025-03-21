'use client'

import React from 'react';
import { Phone, Wifi, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Network Provider Card Component
const NetworkProviderCard = ({ provider }) => {
  const router = useRouter();
  
  // Provider-specific styling and content
  const providerDetails = {
    mtn: {
      name: "MTN Bundle",
      containerBg: "bg-yellow-400",
      textColor: "text-black",
      logoContainerBg: "bg-black",
      logo: "MTN",
      logoTextColor: "text-yellow-400",
      icon: <Wifi size={32} className="text-yellow-400" />
    },
    at: {
      name: "AT Bundle",
      containerBg: "bg-blue-600",
      textColor: "text-white",
      logoContainerBg: "bg-white",
      logo: (
        <div className="text-3xl font-bold">
          <span className="text-red-600">a</span>
          <span className="text-blue-800">t</span>
        </div>
      ),
      icon: <Radio size={32} className="text-blue-600" />
    },
    telecel: {
      name: "TELECEL Bundle",
      containerBg: "bg-red-600",
      textColor: "text-white",
      logoContainerBg: "bg-white",
      logo: "TELECEL",
      logoTextColor: "text-red-600",
      icon: <Phone size={32} className="text-red-600" />
    }
  };
  
  const details = providerDetails[provider];
  
  const handleClick = () => {
    router.push(`/${provider}`);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`${details.containerBg} rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-full`}
    >
      <div className="p-8 flex flex-col items-center">
        <div className={`w-32 h-32 ${details.logoContainerBg} rounded-lg flex items-center justify-center mb-6`}>
          {typeof details.logo === 'string' ? (
            <div className={`text-3xl font-bold ${details.logoTextColor}`}>
              {details.logo}
            </div>
          ) : (
            details.logo
          )}
        </div>
        <div className={`text-2xl font-bold ${details.textColor} mb-4`}>{details.name}</div>
        <div className="flex items-center justify-center mt-2">
          {details.icon}
          <span className={`ml-2 ${details.textColor}`}>Click to view services</span>
        </div>
      </div>
    </div>
  );
};

// Main Services Dashboard Component
const ServicesNetwork = () => {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Iget Services</h1>
        <p className="text-gray-600">Choose your preferred network provider below</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <NetworkProviderCard provider="mtn" />
        <NetworkProviderCard provider="at" />
        <NetworkProviderCard provider="telecel" />
      </div>
    </div>
  );
};

export default ServicesNetwork;