// Index page specific JavaScript with search and filter functionality

// Global variables for search and filter
let currentCategory = "all";
let currentSearch = "";
let performanceOptimizer;
let isLoading = false;

// Sample achievements data
const sampleAchievements = [
  {
    id: "first-job-achievement",
    title: "First Job",
    description: "Successfully landed your first professional position",
    category: "career",
    date: "2024-01-15",
    icon: "💼",
    points: 100,
  },
  {
    id: "college-graduate-achievement",
    title: "College Graduate",
    description: "Completed your bachelor's degree program",
    category: "education",
    date: "2023-05-20",
    icon: "🎓",
    points: 100,
  },
];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  try {
    performanceOptimizer = new PerformanceOptimizer();
    initializeUserStats();
    loadRecentAchievements();
    loadAvailableBadges();
    loadProgressSection();
    loadAchievementHistory();
    updateBadgeStats();
    setupEventListeners();
    setupSearchAndFilter();
  } catch (error) {
    console.error("Error initializing page:", error);
  }
});

// Initialize user statistics
function initializeUserStats() {
  const user = LifeQuest.UserProfile.getUser();

  // Update level display
  const levelElement = document.getElementById("user-level");
  if (levelElement) {
    levelElement.textContent = user.level;
  }

  // Update badges count
  const badgesElement = document.getElementById("badges-count");
  if (badgesElement) {
    badgesElement.textContent = user.badges.length;
  }

  // Update total points
  const pointsElement = document.getElementById("total-points");
  if (pointsElement) {
    pointsElement.textContent = user.totalPoints.toLocaleString();
  }
}

// Load recent achievements
function loadRecentAchievements() {
  const container = document.getElementById("achievements-container");
  if (!container) return;

  const user = LifeQuest.UserProfile.getUser();
  const achievements =
    user.achievements.length > 0 ? user.achievements : sampleAchievements;

  if (achievements.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h4>No achievements yet</h4>
                <p>Start earning badges to see your achievements here!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = achievements
    .slice(0, 6)
    .map(
      (achievement) => `
        <div class="achievement-card">
            <div class="achievement-header">
                <div class="achievement-icon">${achievement.icon}</div>
                <div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-date">${LifeQuest.Utils.formatDate(
                      achievement.date
                    )}</div>
                </div>
            </div>
            <div class="achievement-description">${
              achievement.description
            }</div>
        </div>
    `
    )
    .join("");
}

// Load available badges with search and filter
async function loadAvailableBadges() {
  try {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById("badges-container");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading badges...</span>
            </div>
        `;

    // Get badges based on current filter and search
    let badges = [];
    if (currentCategory === "all") {
      badges = AchievementDatabase.getAll();
    } else {
      badges = AchievementDatabase.getByCategory(currentCategory);
    }

    // Apply search filter
    if (currentSearch) {
      badges = performanceOptimizer.searchBadges(
        currentSearch,
        currentCategory
      );
    }

    // Get random subset for performance
    const randomBadges = performanceOptimizer.loadBadgesByPage(
      0,
      currentCategory
    );

    const user = LifeQuest.UserProfile.getUser();
    const earnedBadgeIds = user.badges.map((badge) => badge.id);

    if (randomBadges.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>No badges found</h4>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
      return;
    }

    container.innerHTML = randomBadges
      .map((badge) => {
        const isEarned = earnedBadgeIds.includes(badge.id);
        const requirements = generateRequirements(badge);

        return `
                <div class="badge-card ${
                  isEarned ? "" : "locked"
                }" data-badge-id="${badge.id}">
                    <div class="badge-status ${isEarned ? "earned" : "locked"}">
                        ${isEarned ? "✓" : "🔒"}
                    </div>
                    <div class="badge-icon ${badge.rarity}">${badge.icon}</div>
                    <div class="badge-title">${badge.title}</div>
                    <div class="badge-description">${badge.description}</div>
                    <div class="badge-requirements">${requirements}</div>
                    ${
                      !isEarned
                        ? `
                        <button class="btn btn-primary claim-badge-btn" data-badge-id="${badge.id}">
                            Claim Badge
                        </button>
                    `
                        : ""
                    }
                </div>
            `;
      })
      .join("");

    updateBadgeStats();
  } catch (error) {
    console.error("Error loading badges:", error);
    const container = document.getElementById("badges-container");
    if (container) {
      container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h4>Error loading badges</h4>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
    }
  } finally {
    isLoading = false;
  }
}

// Load progress section
function loadProgressSection() {
  const container = document.getElementById("progress-container");
  if (!container) return;

  const rarities = ["common", "rare", "elite", "legendary"];
  const user = LifeQuest.UserProfile.getUser();

  container.innerHTML = rarities
    .map((rarity) => {
      const totalInRarity = AchievementDatabase.getByRarity(rarity).length;
      const earnedInRarity = user.badges.filter(
        (badge) => badge.rarity === rarity
      ).length;
      const percentage =
        totalInRarity > 0
          ? Math.round((earnedInRarity / totalInRarity) * 100)
          : 0;

      return `
            <div class="progress-card">
                <div class="progress-circle ${rarity}">${percentage}%</div>
                <h4>${rarity.charAt(0).toUpperCase() + rarity.slice(1)}</h4>
                <div class="progress-text">${earnedInRarity}/${totalInRarity} earned</div>
            </div>
        `;
    })
    .join("");
}

// Load achievement history
function loadAchievementHistory() {
  const container = document.getElementById("history-container");
  const totalEarnedElement = document.getElementById("total-earned");
  const monthEarnedElement = document.getElementById("month-earned");

  if (!container) return;

  const user = LifeQuest.UserProfile.getUser();
  const achievements = user.achievements.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Calculate monthly achievements
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthAchievements = achievements.filter((achievement) => {
    const achievementDate = new Date(achievement.date);
    return (
      achievementDate.getMonth() === thisMonth &&
      achievementDate.getFullYear() === thisYear
    );
  });

  // Update stats
  if (totalEarnedElement) totalEarnedElement.textContent = achievements.length;
  if (monthEarnedElement)
    monthEarnedElement.textContent = monthAchievements.length;

  if (achievements.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📜</div>
                <h4>No achievement history</h4>
                <p>Start earning badges to build your history!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = achievements
    .slice(0, 10)
    .map(
      (achievement) => `
        <div class="history-item">
            <div class="history-icon" style="background-color: ${getRarityColor(
              achievement.rarity
            )}">${achievement.icon}</div>
            <div class="history-content">
                <div class="history-title">${achievement.title}</div>
                <div class="history-date">${LifeQuest.Utils.formatDate(
                  achievement.date
                )}</div>
            </div>
            <div class="history-points">+${achievement.points}</div>
        </div>
    `
    )
    .join("");
}

// Setup search and filter functionality
function setupSearchAndFilter() {
  const searchInput = document.getElementById("badge-search");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      performanceOptimizer.debouncedSearch(currentSearch, (results) => {
        loadAvailableBadges();
      });
    });
  }

  // Filter functionality
  filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      // Update active state
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");

      // Update current category
      currentCategory = e.target.dataset.category;

      // Reload badges
      loadAvailableBadges();
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Badge claim buttons
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("claim-badge-btn")) {
      const badgeId = e.target.dataset.badgeId;
      handleBadgeClaim(badgeId);
    }
  });

  // Badge card clicks for details
  document.addEventListener("click", (e) => {
    if (e.target.closest(".badge-card")) {
      const badgeCard = e.target.closest(".badge-card");
      const badgeId = badgeCard.dataset.badgeId;
      showBadgeDetails(badgeId);
    }
  });

  // Load more badges button
  const loadMoreBtn = document.getElementById("load-more-badges");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      loadAvailableBadges();
      LifeQuest.NotificationSystem.info("Loaded more badges!");
    });
  }

  // Shuffle badges button
  const shuffleBtn = document.getElementById("shuffle-badges");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      loadAvailableBadges();
      LifeQuest.NotificationSystem.info("Badges shuffled!");
    });
  }
}

// Handle badge claim
function handleBadgeClaim(badgeId) {
  const badge = AchievementDatabase.getAll().find((b) => b.id === badgeId);
  if (!badge) return;

  // Show verification modal
  showVerificationModal(badge);
}

// Show verification modal
function showVerificationModal(badge) {
  const modal = document.createElement("div");
  modal.className = "verification-modal";
  modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Claim Badge: ${badge.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="badge-preview">
                        <div class="badge-icon ${badge.rarity}">${
    badge.icon
  }</div>
                        <h4>${badge.title}</h4>
                        <p>${badge.description}</p>
                        <div class="badge-rarity">${badge.rarity.toUpperCase()} - ${
    badge.points
  } points</div>
                    </div>
                    <div class="verification-section">
                        <h4>Verification Required</h4>
                        <p><strong>Requirements:</strong> ${generateRequirements(
                          badge
                        )}</p>
                        <p><strong>Method:</strong> ${
                          LifeQuest.BadgeSystem.verificationMethods[
                            generateVerificationMethod(badge)
                          ]
                        }</p>
                        
                        <div class="verification-options">
                            <button class="btn btn-primary upload-proof-btn">
                                Upload Proof
                            </button>
                            <button class="btn btn-secondary social-verify-btn">
                                Social Verification
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add modal styles
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

  const overlay = modal.querySelector(".modal-overlay");
  overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

  const content = modal.querySelector(".modal-content");
  content.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    `;

  document.body.appendChild(modal);

  // Close modal
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(modal);
    }
  });

  // Handle verification buttons
  const uploadBtn = modal.querySelector(".upload-proof-btn");
  uploadBtn.addEventListener("click", () => {
    LifeQuest.NotificationSystem.info("File upload feature coming soon!");
  });

  const socialBtn = modal.querySelector(".social-verify-btn");
  socialBtn.addEventListener("click", () => {
    LifeQuest.NotificationSystem.info(
      "Social verification feature coming soon!"
    );
  });
}

// Show badge details
function showBadgeDetails(badgeId) {
  const badge = AchievementDatabase.getAll().find((b) => b.id === badgeId);
  if (!badge) return;

  const user = LifeQuest.UserProfile.getUser();
  const isEarned = user.badges.some((b) => b.id === badgeId);

  if (isEarned) {
    LifeQuest.NotificationSystem.success(
      `You've earned the ${badge.title} badge!`
    );
  } else {
    LifeQuest.NotificationSystem.info(
      `Click "Claim Badge" to earn the ${badge.title} badge.`
    );
  }
}

// Update badge statistics
function updateBadgeStats() {
  const totalBadges = AchievementDatabase.getAll().length;
  const user = LifeQuest.UserProfile.getUser();
  const earnedBadges = user.badges.length;
  const remainingBadges = totalBadges - earnedBadges;

  const totalElement = document.getElementById("total-badges");
  const earnedElement = document.getElementById("earned-badges");
  const remainingElement = document.getElementById("remaining-badges");

  if (totalElement) totalElement.textContent = totalBadges.toLocaleString();
  if (earnedElement) earnedElement.textContent = earnedBadges.toLocaleString();
  if (remainingElement)
    remainingElement.textContent = remainingBadges.toLocaleString();
}

// Generate requirements based on badge
function generateRequirements(badge) {
  const requirements = {
    career: "Upload employment contract or pay stub",
    education: "Upload diploma or transcript",
    health: "Upload certificate or proof",
    financial: "Upload financial documentation",
    travel: "Upload passport stamps or photos",
    social: "Social verification required",
    creative: "Upload portfolio or proof",
    technology: "Upload certification or code",
    lifestyle: "Upload proof of purchase",
    extreme: "Upload video or certificate",
  };

  return requirements[badge.category] || "Document verification required";
}

// Generate verification method based on badge
function generateVerificationMethod(badge) {
  const methods = {
    career: "document",
    education: "document",
    health: "document",
    financial: "thirdParty",
    travel: "document",
    social: "social",
    creative: "document",
    technology: "document",
    lifestyle: "document",
    extreme: "document",
  };

  return methods[badge.category] || "document";
}

// Get rarity color
function getRarityColor(rarity) {
  const colors = {
    common: "#9ca3af",
    rare: "#f59e0b",
    elite: "#6366f1",
    legendary: "#8b5cf6",
  };
  return colors[rarity] || "#9ca3af";
}

// Simulate achievement unlock (for demo purposes)
function simulateAchievement() {
  const newAchievement = {
    title: "Demo Achievement",
    description: "This is a demo achievement for testing purposes",
    category: "personal",
    icon: "🎉",
    rarity: "common",
  };

  const achievement = LifeQuest.UserProfile.addAchievement(newAchievement);
  LifeQuest.NotificationSystem.success(
    `Achievement unlocked: ${achievement.title}!`
  );

  // Refresh the page data
  initializeUserStats();
  loadRecentAchievements();
  loadAchievementHistory();
  loadProgressSection();
}

// Add demo button for testing (remove in production)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  const demoBtn = document.createElement("button");
  demoBtn.textContent = "Demo Achievement";
  demoBtn.className = "btn btn-secondary";
  demoBtn.style.cssText =
    "position: fixed; bottom: 20px; right: 20px; z-index: 1000;";
  demoBtn.addEventListener("click", simulateAchievement);
  document.body.appendChild(demoBtn);
}
