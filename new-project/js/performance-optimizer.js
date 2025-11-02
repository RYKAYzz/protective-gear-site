// Performance Optimizer for LifeQuest
// Handles large achievement database efficiently

class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.loadedBadges = new Set();
    this.pageSize = 12;
    this.currentPage = 0;
  }

  // Lazy load achievements
  async loadBadgesByPage(page = 0, category = null) {
    try {
      const start = page * this.pageSize;
      const end = start + this.pageSize;

      let badges = [];
      if (category && AchievementDatabase[category]) {
        badges = AchievementDatabase[category];
      } else {
        badges = AchievementDatabase.getAll();
      }

      return badges.slice(start, end);
    } catch (error) {
      console.error("Error loading badges:", error);
      return [];
    }
  }

  // Search badges efficiently
  searchBadges(query, category = null) {
    try {
      const searchTerm = query.toLowerCase();
      let badges = [];

      if (category && AchievementDatabase[category]) {
        badges = AchievementDatabase[category];
      } else {
        badges = AchievementDatabase.getAll();
      }

      return badges.filter(
        (badge) =>
          badge.title.toLowerCase().includes(searchTerm) ||
          badge.description.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error("Error searching badges:", error);
      return [];
    }
  }

  // Get badges by category
  getBadgesByCategory(category) {
    try {
      return AchievementDatabase.getByCategory(category) || [];
    } catch (error) {
      console.error("Error getting badges by category:", error);
      return [];
    }
  }

  // Get user progress for a badge
  getUserProgress(badgeId) {
    try {
      const user = LifeQuest.UserProfile.getUser();
      const badge = AchievementDatabase.getAll().find((b) => b.id === badgeId);

      if (!badge) return { progress: 0, isEarned: false };

      const isEarned = user.badges.some((b) => b.id === badgeId);
      return { progress: isEarned ? 100 : 0, isEarned };
    } catch (error) {
      console.error("Error getting user progress:", error);
      return { progress: 0, isEarned: false };
    }
  }

  // Validate badge data
  validateBadge(badge) {
    const required = ["id", "title", "description", "rarity", "icon", "points"];
    const validRarities = ["common", "rare", "elite", "legendary"];

    try {
      // Check required fields
      for (const field of required) {
        if (!badge[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check rarity
      if (!validRarities.includes(badge.rarity)) {
        throw new Error(`Invalid rarity: ${badge.rarity}`);
      }

      // Check points
      if (typeof badge.points !== "number" || badge.points < 0) {
        throw new Error(`Invalid points: ${badge.points}`);
      }

      return true;
    } catch (error) {
      console.error("Badge validation failed:", error);
      return false;
    }
  }

  // Debounced search
  debouncedSearch = LifeQuest.Utils.debounce((query, callback) => {
    const results = this.searchBadges(query);
    callback(results);
  }, 300);
}

// Error Handler
class ErrorHandler {
  static handleError(error, context = "") {
    console.error(`Error in ${context}:`, error);

    // Show user-friendly error message
    LifeQuest.NotificationSystem.error(
      `Something went wrong. Please try again.`
    );

    // Log to analytics (in real app)
    this.logError(error, context);
  }

  static logError(error, context) {
    // In real app, send to error tracking service
    console.log("Error logged:", {
      error: error.message,
      context,
      timestamp: new Date(),
    });
  }
}

// Data Validator
class DataValidator {
  static validateUserData(userData) {
    try {
      const required = [
        "id",
        "name",
        "age",
        "level",
        "badges",
        "achievements",
        "totalPoints",
      ];

      for (const field of required) {
        if (!userData.hasOwnProperty(field)) {
          throw new Error(`Missing required user field: ${field}`);
        }
      }

      // Validate arrays
      if (
        !Array.isArray(userData.badges) ||
        !Array.isArray(userData.achievements)
      ) {
        throw new Error("Badges and achievements must be arrays");
      }

      // Validate numbers
      if (typeof userData.age !== "number" || userData.age < 0) {
        throw new Error("Invalid age");
      }

      if (
        typeof userData.totalPoints !== "number" ||
        userData.totalPoints < 0
      ) {
        throw new Error("Invalid total points");
      }

      return true;
    } catch (error) {
      console.error("User data validation failed:", error);
      return false;
    }
  }
}

// Export for use
window.PerformanceOptimizer = PerformanceOptimizer;
window.ErrorHandler = ErrorHandler;
window.DataValidator = DataValidator;
