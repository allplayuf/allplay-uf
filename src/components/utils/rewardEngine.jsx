// 🎁 REWARD ENGINE - Central system for XP, badges, and celebrations
import feedback from '@/components/ui/feedback-toast';
import { triggerHaptic, playSound } from './motionTokens';

class RewardEngine {
  constructor() {
    this.listeners = {};
  }

  // Event bus for rewards
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Calculate XP for different actions
  calculateXP(action, data = {}) {
    const XP_VALUES = {
      'match.created': 50,
      'match.joined': 20,
      'match.completed': 100,
      'match.checked_in': 30,
      'mvp.voted': 10,
      'mvp.won': 150,
      'friend.added': 25,
      'team.created': 100,
      'team.joined': 30,
      'streak.maintained': (data.days || 1) * 10,
      'quest.completed': data.xp || 50,
      'first.match': 200,
      'reaction.given': 5
    };

    return XP_VALUES[action] || 0;
  }

  // Award XP and trigger celebrations
  async awardXP(userId, action, data = {}, showCelebration = true) {
    const xp = this.calculateXP(action, data);
    
    if (xp > 0 && showCelebration) {
      this.celebrate(action, xp, data);
    }

    // Emit event for other systems to listen
    this.emit('xp.awarded', { userId, action, xp, data });

    return xp;
  }

  // Celebration UI
  celebrate(action, xp, data = {}) {
    triggerHaptic('success');
    playSound('reward');

    const celebrationMessages = {
      'match.created': '🎉 Match skapad!',
      'match.joined': '⚽ Du är med!',
      'match.completed': '🏆 Match avslutad!',
      'mvp.won': '⭐ MVP! Grattis!',
      'streak.maintained': `🔥 ${data.days} dagars streak!`,
      'quest.completed': '✅ Quest slutförd!',
      'friend.added': '🤝 Ny vän tillagd!'
    };

    toast.success(celebrationMessages[action] || 'Bra jobbat!', {
      description: `+${xp} XP`,
      duration: 3000,
      icon: '✨'
    });

    // Trigger confetti for big achievements
    const bigAchievements = ['mvp.won', 'match.created', 'first.match', 'quest.completed'];
    if (bigAchievements.includes(action)) {
      this.triggerConfetti();
    }
  }

  // Confetti animation
  triggerConfetti() {
    this.emit('confetti.trigger', {});
    
    // Simple confetti implementation
    if (typeof document !== 'undefined') {
      const colors = ['#2BA84A', '#F4743B', '#4169E1', '#FFD700'];
      const confettiCount = 30;
      
      for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${50 + (Math.random() - 0.5) * 30}%;
            top: 30%;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            animation: confettiFall 1.5s ease-out forwards;
          `;
          
          document.body.appendChild(confetti);
          
          setTimeout(() => confetti.remove(), 1500);
        }, i * 30);
      }
      
      // Add keyframe animation if not exists
      if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
          @keyframes confettiFall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  // Check and award badges
  async checkBadges(userId, userStats) {
    const badges = [];
    
    // Match milestones
    if (userStats.matches_played === 1) badges.push({ id: 'first_match', name: 'Första matchen', xp: 200 });
    if (userStats.matches_played === 10) badges.push({ id: 'veteran', name: 'Veteran', xp: 300 });
    if (userStats.matches_played === 50) badges.push({ id: 'enthusiast', name: 'Entusiast', xp: 500 });
    
    // MVP achievements
    if (userStats.mvp_count === 1) badges.push({ id: 'first_mvp', name: 'Första MVP', xp: 150 });
    if (userStats.mvp_count === 5) badges.push({ id: 'mvp_star', name: 'MVP Stjärna', xp: 400 });
    
    // Streaks
    if (userStats.current_streak === 7) badges.push({ id: 'week_streak', name: '7 Dagars Streak', xp: 200 });
    if (userStats.current_streak === 30) badges.push({ id: 'month_streak', name: '30 Dagars Streak', xp: 1000 });

    // Award new badges
    for (const badge of badges) {
      this.emit('badge.unlocked', { userId, badge });
      this.celebrateBadge(badge);
    }

    return badges;
  }

  celebrateBadge(badge) {
    triggerHaptic('success');
    playSound('reward');
    
    feedback.success(`🏅 Badge upplåst: ${badge.name}!`, {
      description: `+${badge.xp} XP`,
      duration: 5000,
    });
    
    this.triggerConfetti();
  }
}

// Singleton instance
export const rewardEngine = new RewardEngine();

export default rewardEngine;