import React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickAccessGrid({ onCreateMatch }) {
  const items = [
    {
      icon: MapPin,
      label: "Hitta Planer",
      color: "#2BA84A",
      gradient: "from-[#2BA84A] to-[#248232]",
      link: createPageUrl("Map"),
      delay: 0.3
    },
    {
      icon: Plus,
      label: "Skapa match",
      color: "#F4743B",
      gradient: "from-[#F4743B] to-[#E5683A]",
      action: onCreateMatch,
      delay: 0.4
    },
    {
      icon: Users,
      label: "Vänner & lag",
      color: "#2BA84A",
      gradient: "from-[#2BA84A] to-[#248232]",
      link: createPageUrl("Community"),
      delay: 0.5
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: item.delay }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          {item.link ? (
            <Link to={item.link}>
              <QuickAccessCard item={item} />
            </Link>
          ) : (
            <button onClick={item.action} className="w-full">
              <QuickAccessCard item={item} />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function QuickAccessCard({ item }) {
  return (
    <div className="relative overflow-hidden bg-[#121715] border border-[#223029] shadow-lg rounded-[20px] p-4 sm:p-5 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center group hover:border-[#2BA84A]/30 transition-all">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${item.color === '#2BA84A' ? 'from-[#2BA84A]/10' : 'from-[#F4743B]/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <motion.div
        whileHover={{ rotate: item.label === "Skapa match" ? 90 : [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-all`}
      >
        <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
      </motion.div>
      <span className="text-xs sm:text-sm font-bold text-[#F4F7F5] text-center leading-tight px-1">
        {item.label}
      </span>
    </div>
  );
}