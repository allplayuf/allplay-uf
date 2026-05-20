import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Users, Trophy, Zap, Star, Sparkles, Shield } from 'lucide-react';

// Confetti component
const Confetti = () => {
  const colors = ['#2BA84A', '#F4743B', '#9B59B6', '#FFD700', '#14B8A6'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 4
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ 
            y: -20, 
            x: `${piece.x}vw`,
            opacity: 1,
            rotate: 0
          }}
          animate={{ 
            y: '100vh',
            rotate: 360,
            opacity: 0
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn'
          }}
          style={{
            position: 'absolute',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.size % 2 === 0 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  );
};

// Handshake animation component
const HandshakeAnimation = () => {
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
      <motion.div
        initial={{ x: -30, rotate: -20 }}
        animate={{ x: 0, rotate: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </motion.div>
      <motion.div
        initial={{ x: 30, rotate: 20 }}
        animate={{ x: 0, rotate: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </motion.div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute"
      >
        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFD700]" />
      </motion.div>
    </div>
  );
};

// Team banner animation
const TeamBanner = ({ teamName }) => {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      className="relative w-full"
    >
      <div className="bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] rounded-xl p-3 sm:p-4 overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div className="relative flex items-center gap-2 sm:gap-3">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs sm:text-sm font-medium">Välkommen till</p>
            <p className="text-white text-base sm:text-lg font-bold truncate">{teamName}!</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Achievement popup
const AchievementPopup = ({ title, description, icon: Icon }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className="relative w-full"
    >
      <motion.div
        animate={{ 
          boxShadow: [
            '0 0 20px rgba(255, 215, 0, 0.5)',
            '0 0 40px rgba(255, 215, 0, 0.8)',
            '0 0 20px rgba(255, 215, 0, 0.5)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl p-3 sm:p-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs sm:text-sm font-medium truncate">{title}</p>
            <p className="text-white/80 text-[10px] sm:text-xs truncate">{description}</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute inset-0 border-4 border-[#FFD700] rounded-xl"
      />
    </motion.div>
  );
};

export const CelebrationToast = ({ 
  type = 'match', 
  message = '', 
  details = {},
  duration = 4000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const renderContent = () => {
    switch (type) {
      case 'match_join':
        return (
          <>
            {/* Confetti effect */}
            <Confetti />
            
            {/* Toast content */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 px-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#F4743B] to-[#E5683A] rounded-full flex items-center justify-center shadow-lg"
              >
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <div className="text-center max-w-full">
                <h3 className="text-base sm:text-lg font-bold text-[#F4F7F5] mb-1">🔥 Du är med!</h3>
                <p className="text-xs sm:text-sm text-[#B6C2BC] px-2">{message || 'Du har anmält dig till matchen'}</p>
                {details.matchTitle && (
                  <p className="text-[10px] sm:text-xs text-[#2BA84A] font-medium mt-1 truncate px-2">{details.matchTitle}</p>
                )}
              </div>
            </div>
          </>
        );

      case 'friend_added':
        return (
          <div className="flex flex-col items-center gap-2 sm:gap-3 px-2">
            <HandshakeAnimation />
            <div className="text-center max-w-full">
              <h3 className="text-base sm:text-lg font-bold text-[#F4F7F5] mb-1">🤝 Ny vän!</h3>
              <p className="text-xs sm:text-sm text-[#B6C2BC] px-2">{message || 'Ni är nu vänner'}</p>
              {details.friendName && (
                <p className="text-[10px] sm:text-xs text-[#2BA84A] font-medium mt-1 truncate px-2">Du och {details.friendName}</p>
              )}
            </div>
          </div>
        );

      case 'team_joined':
        return (
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full px-2">
            <TeamBanner teamName={details.teamName || 'Laget'} />
            <div className="text-center">
              <p className="text-xs sm:text-sm text-[#B6C2BC]">{message || 'Du är nu medlem'}</p>
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full px-2">
            <AchievementPopup 
              title={details.title || 'Utmärkelse upplåst!'}
              description={message || details.description || 'Grattis!'}
              icon={details.icon || Trophy}
            />
          </div>
        );

      case 'streak':
        return (
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full px-2">
            <AchievementPopup 
              title={`${details.streakCount || 0} 🔥 Streak!`}
              description={message || 'Du är på gång!'}
              icon={Flame}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-[#F4F7F5] truncate">{message}</h3>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-full max-w-[380px] pointer-events-auto"
          >
            <div className="bg-[#0F1A14] border border-[#2BA84A]/40 rounded-2xl p-5 sm:p-6 shadow-[0_32px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-[#1A2620] hover:bg-[#243028] transition-colors z-10"
              >
                <X className="w-4 h-4 text-[#9EAAA4]" />
              </button>

              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Hook for using celebration toasts
export const useCelebrationToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (config) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...config }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <CelebrationToast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};