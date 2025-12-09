import React from 'react';
import { motion } from 'framer-motion';

export function AppLoading() {
  return (
    <div className="fixed inset-0 bg-[#131816] flex items-center justify-center z-[9999]">
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 mb-4"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dbdc9e123473250628e807/31f9a1cc1_LOGGAINGENBAGRUNDOUTLINE.png" 
            alt="AllPlay" 
            className="w-full h-full object-contain"
          />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-1 w-32 bg-[#2BA84A]/20 rounded-full overflow-hidden"
        >
          <motion.div 
            className="h-full bg-[#2BA84A] rounded-full w-1/3"
            animate={{ x: [-40, 140] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}