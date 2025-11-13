
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, HelpCircle } from 'lucide-react';

// Dialog types with their icons and colors
const DIALOG_TYPES = {
  confirm: {
    icon: HelpCircle,
    color: '#2BA84A',
    bgGradient: 'from-[#2BA84A]/10 to-[#0F2917]/10'
  },
  alert: {
    icon: AlertCircle,
    color: '#F4743B',
    bgGradient: 'from-[#F4743B]/10 to-[#E5683A]/10'
  },
  warning: {
    icon: AlertTriangle,
    color: '#F59E0B',
    bgGradient: 'from-[#F59E0B]/10 to-[#D97706]/10'
  },
  info: {
    icon: Info,
    color: '#4169E1',
    bgGradient: 'from-[#4169E1]/10 to-[#3457D5]/10'
  },
  success: {
    icon: CheckCircle,
    color: '#2BA84A',
    bgGradient: 'from-[#2BA84A]/10 to-[#0F2917]/10'
  }
};

export const CustomDialog = ({
  type = 'confirm',
  title = '',
  message = '',
  confirmText = 'Bekräfta',
  cancelText = 'Avbryt',
  onConfirm,
  onCancel,
  showCancel = true,
  isOpen = false
}) => {
  const config = DIALOG_TYPES[type] || DIALOG_TYPES.confirm;
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: 0.3 
          }}
          className="relative w-full max-w-md mx-auto"
        >
          <motion.div 
            className="bg-[#121715] border border-[#223029] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            animate={{
              boxShadow: [
                '0_20px_50px_rgba(0,0,0,0.5)',
                `0_20px_60px_${config.color}20`,
                '0_20px_50px_rgba(0,0,0,0.5)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${config.bgGradient} p-6 border-b border-[#223029] relative overflow-hidden`}>
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{ 
                  background: `radial-gradient(circle at 50% 50%, ${config.color}40, transparent 70%)`
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="flex items-start gap-4 relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: [0, 1.1, 1],
                    rotate: [-180, 10, 0]
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1
                  }}
                  className="flex-shrink-0"
                >
                  <motion.div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${config.color}30` }}
                    animate={{
                      boxShadow: [
                        `0_4px_16px_${config.color}40`,
                        `0_4px_24px_${config.color}60`,
                        `0_4px_16px_${config.color}40`
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.div
                      animate={type === 'success' ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      } : {}}
                      transition={{
                        duration: 0.6,
                        repeat: type === 'success' ? Infinity : 0,
                        repeatDelay: 2
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: config.color }} />
                    </motion.div>
                  </motion.div>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-lg sm:text-xl font-bold text-[#F4F7F5] mb-1"
                  >
                    {title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-sm sm:text-base text-[#B6C2BC] leading-relaxed"
                  >
                    {message}
                  </motion.p>
                </div>

                {onCancel && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onCancel}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#18221E] transition-colors text-[#B6C2BC] hover:text-[#F4F7F5]"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Actions - MOBILANPASSADE KNAPPAR */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3"
            >
              {showCancel && onCancel && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  className="flex-1 h-12 sm:h-12 rounded-[14px] border-2 border-[#223029] text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5] hover:border-[#2BA84A]/30 font-semibold transition-all text-base"
                >
                  {cancelText}
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: `0 6px 24px ${config.color}60`
                }}
                whileTap={{ scale: 0.97 }}
                animate={{
                  boxShadow: [
                    `0 4px 16px ${config.color}40`,
                    `0 6px 20px ${config.color}50`,
                    `0 4px 16px ${config.color}40`
                  ]
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                onClick={() => {
                  if (onConfirm) onConfirm();
                }}
                className="flex-1 h-14 sm:h-14 rounded-[14px] font-bold text-white transition-all text-base sm:text-lg relative overflow-hidden min-h-[56px]"
                style={{
                  background: `linear-gradient(to right, ${config.color}, ${config.color}dd)`
                }}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
                <span className="relative z-10">{confirmText}</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Hook for using custom dialogs
export const useCustomDialog = () => {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = (config) => {
    return new Promise((resolve) => {
      const id = Date.now();
      const dialog = {
        id,
        ...config,
        isOpen: true,
        onConfirm: () => {
          removeDialog(id);
          resolve(true);
        },
        onCancel: () => {
          removeDialog(id);
          resolve(false);
        }
      };
      setDialogs(prev => [...prev, dialog]);
    });
  };

  const removeDialog = (id) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  };

  const confirm = (title, message, options = {}) => {
    return showDialog({
      type: 'confirm',
      title,
      message,
      confirmText: options.confirmText || 'Bekräfta',
      cancelText: options.cancelText || 'Avbryt',
      showCancel: true,
      ...options
    });
  };

  const alert = (title, message, options = {}) => {
    return showDialog({
      type: options.type || 'alert',
      title,
      message,
      confirmText: options.confirmText || 'OK',
      showCancel: false,
      ...options
    });
  };

  const DialogContainer = () => (
    <>
      {dialogs.map(dialog => (
        <CustomDialog key={dialog.id} {...dialog} />
      ))}
    </>
  );

  return { confirm, alert, DialogContainer };
};
