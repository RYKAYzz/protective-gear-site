// Common JavaScript - Shared utilities across all pages

// Utility functions
const Utils = {
  // Format date to readable string
  formatDate: (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Calculate age from birth date
  calculateAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  },

  // Generate random ID
  generateId: () => {
    return Math.random().toString(36).substr(2, 9);
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Local storage utilities
  storage: {
    get: (key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (error) {
        console.error("Error reading from localStorage:", error);
        return null;
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error("Error writing to localStorage:", error);
        return false;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error("Error removing from localStorage:", error);
        return false;
      }
    },
  },
};

// Badge system
const BadgeSystem = {
  // Badge categories
  categories: {
    common: {
      name: "Common",
      color: "#9ca3af",
      rarity: 1,
    },
    rare: {
      name: "Rare",
      color: "#f59e0b",
      rarity: 2,
    },
    elite: {
      name: "Elite",
      color: "#6366f1",
      rarity: 3,
    },
    legendary: {
      name: "Legendary",
      color: "#8b5cf6",
      rarity: 4,
    },
  },

  // Badge verification methods
  verificationMethods: {
    document: "Document Upload",
    social: "Social Verification",
    thirdParty: "Third-party Integration",
    community: "Community Review",
    timeBased: "Time-based Verification",
  },

  // Get badge category info
  getCategoryInfo: (category) => {
    return BadgeSystem.categories[category] || BadgeSystem.categories.common;
  },

  // Calculate badge rarity percentage
  calculateRarity: (category) => {
    const categoryInfo = BadgeSystem.getCategoryInfo(category);
    const maxRarity = 4;
    return ((maxRarity - categoryInfo.rarity + 1) / maxRarity) * 100;
  },
};

// Achievement system
const AchievementSystem = {
  // Achievement types
  types: {
    education: "Education",
    career: "Career",
    personal: "Personal",
    health: "Health & Fitness",
    social: "Social",
    financial: "Financial",
    travel: "Travel",
    creative: "Creative",
  },

  // Calculate achievement points
  calculatePoints: (achievement) => {
    const basePoints = 100;
    const categoryMultiplier = BadgeSystem.getCategoryInfo(
      achievement.category
    ).rarity;
    return basePoints * categoryMultiplier;
  },

  // Format achievement date
  formatAchievementDate: (date) => {
    return Utils.formatDate(date);
  },
};

// User profile system
const UserProfile = {
  // Get user data
  getUser: () => {
    return (
      Utils.storage.get("user") || {
        id: Utils.generateId(),
        name: "Anonymous User",
        age: 25,
        level: 25,
        badges: [],
        achievements: [],
        totalPoints: 0,
        joinDate: new Date().toISOString(),
      }
    );
  },

  // Save user data
  saveUser: (userData) => {
    return Utils.storage.set("user", userData);
  },

  // Update user level based on age
  updateLevel: (age) => {
    return age;
  },

  // Add achievement
  addAchievement: (achievement) => {
    const user = UserProfile.getUser();
    const points = AchievementSystem.calculatePoints(achievement);

    achievement.id = Utils.generateId();
    achievement.date = new Date().toISOString();
    achievement.points = points;

    user.achievements.push(achievement);
    user.totalPoints += points;

    UserProfile.saveUser(user);
    return achievement;
  },

  // Add badge
  addBadge: (badge) => {
    const user = UserProfile.getUser();

    badge.id = Utils.generateId();
    badge.earnedDate = new Date().toISOString();
    badge.isDisplayed = true;

    user.badges.push(badge);

    UserProfile.saveUser(user);
    return badge;
  },

  // Toggle badge display
  toggleBadgeDisplay: (badgeId, isDisplayed) => {
    const user = UserProfile.getUser();
    const badge = user.badges.find((b) => b.id === badgeId);

    if (badge) {
      badge.isDisplayed = isDisplayed;
      UserProfile.saveUser(user);
      return true;
    }

    return false;
  },
};

// Notification system
const NotificationSystem = {
  // Show notification
  show: (message, type = "info", duration = 3000) => {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 1000;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Close button
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      NotificationSystem.hide(notification);
    });

    // Auto hide
    setTimeout(() => {
      NotificationSystem.hide(notification);
    }, duration);
  },

  // Hide notification
  hide: (notification) => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  },

  // Success notification
  success: (message) => {
    NotificationSystem.show(message, "success");
  },

  // Error notification
  error: (message) => {
    NotificationSystem.show(message, "error");
  },

  // Info notification
  info: (message) => {
    NotificationSystem.show(message, "info");
  },
};

// Mobile detection
const MobileDetector = {
  isMobile: () => {
    return window.innerWidth <= 768;
  },

  isTablet: () => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  },

  isDesktop: () => {
    return window.innerWidth > 1024;
  },
};

// Initialize common functionality
document.addEventListener("DOMContentLoaded", () => {
  // Add mobile-specific classes
  if (MobileDetector.isMobile()) {
    document.body.classList.add("mobile");
  }

  // Handle navigation active states
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Handle window resize
  window.addEventListener(
    "resize",
    Utils.debounce(() => {
      if (MobileDetector.isMobile()) {
        document.body.classList.add("mobile");
      } else {
        document.body.classList.remove("mobile");
      }
    }, 250)
  );
});

// Export for use in other files
window.LifeQuest = {
  Utils,
  BadgeSystem,
  AchievementSystem,
  UserProfile,
  NotificationSystem,
  MobileDetector,
};
