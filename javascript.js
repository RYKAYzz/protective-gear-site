// Global variables
let selectedProducts = [];
let currentFilter = "all";

// Smooth scrolling function
function scrollToSection(sectionId) {
  console.log("scrollToSection called with:", sectionId);
  const element = document.getElementById(sectionId);
  if (element) {
    console.log("Element found, scrolling to:", sectionId);
    element.scrollIntoView({ behavior: "smooth" });
  } else {
    console.error("Element not found for section:", sectionId);
    // Try to find the element by class as fallback
    const fallbackElement = document.querySelector(`[id="${sectionId}"]`);
    if (fallbackElement) {
      console.log("Element found via fallback, scrolling to:", sectionId);
      fallbackElement.scrollIntoView({ behavior: "smooth" });
    } else {
      console.error(
        "Element not found even with fallback for section:",
        sectionId
      );
    }
  }
}

// Product selection functionality
function selectProduct(productId, productName) {
  const productItem = document.querySelector(`[data-product="${productId}"]`);
  const isSelected = productItem.classList.contains("selected");

  if (isSelected) {
    // Deselect product
    productItem.classList.remove("selected");
    selectedProducts = selectedProducts.filter((p) => p.id !== productId);
    // Remove quantity input if exists
    const quantityInput = productItem.querySelector(".quantity-selector");
    if (quantityInput) {
      quantityInput.remove();
    }
  } else {
    // Select product
    productItem.classList.add("selected");
    selectedProducts.push({ id: productId, name: productName, quantity: 50 });

    // Add quantity input
    const productActions = productItem.querySelector(".product-actions");
    const quantityDiv = document.createElement("div");
    quantityDiv.className = "quantity-selector show";
    quantityDiv.innerHTML = `
      <label class="quantity-label">Quantity:</label>
      <input type="number" min="10" value="50" class="quantity-input" 
             onchange="updateQuantity('${productId}', this.value)"
             onclick="event.stopPropagation()">
    `;
    productActions.appendChild(quantityDiv);
  }

  updateSelectionCounter();
  showNotification(`${productName} ${isSelected ? "deselected" : "selected"}`);
}

// Update product quantity
function updateQuantity(productId, quantity) {
  const product = selectedProducts.find((p) => p.id === productId);
  if (product) {
    const newQuantity = parseInt(quantity) || 10;
    // Ensure minimum quantity of 10
    product.quantity = Math.max(newQuantity, 10);
    updateSelectionCounter();

    // Update the input value if it was below minimum
    const input = document.querySelector(
      `[data-product="${productId}"] .quantity-input`
    );
    if (input && newQuantity < 10) {
      input.value = product.quantity;
    }
  }
}

// Send selection with images
function sendSelection(event) {
  // Additional safeguard - prevent any automatic calls
  if (typeof event === "undefined" || event === null) {
    console.log("sendSelection called without event - preventing execution");
    return;
  }

  const sendBtn = document.querySelector(".send-selection-btn");

  // Check if button is disabled
  if (sendBtn && sendBtn.disabled) {
    showNotification("No products selected!");
    return;
  }

  if (selectedProducts.length === 0) {
    showNotification("No products selected!");
    return;
  }

  // Prevent automatic triggering - only allow when button is actually clicked
  // Check if this is a real click event from the button
  if (
    !event ||
    event.type !== "click" ||
    !event.target ||
    !event.target.classList.contains("send-selection-btn")
  ) {
    console.log(
      "sendSelection called with invalid event - preventing execution"
    );
    return;
  }

  // Additional check - ensure this is a user-initiated action
  if (!event.isTrusted) {
    console.log(
      "sendSelection called with non-trusted event - preventing execution"
    );
    return;
  }

  // Final check - ensure the clicked element is actually the send button
  if (event.target !== sendBtn) {
    console.log(
      "sendSelection called from wrong element - preventing execution"
    );
    return;
  }

  // Detect page type from URL or title
  const pageTitle = document.title || "";
  let pageType = "Product";

  if (pageTitle.includes("PPE") || pageTitle.includes("Safety")) {
    pageType = "PPE & Safety Gear";
  } else if (pageTitle.includes("Medical")) {
    pageType = "Medical Equipment";
  } else if (
    pageTitle.includes("Sterilization") ||
    pageTitle.includes("Waste")
  ) {
    pageType = "Sterilization & Waste Equipment";
  } else if (pageTitle.includes("Sanitary")) {
    pageType = "Sanitary Solutions";
  } else if (pageTitle.includes("Spill")) {
    pageType = "Spill Management";
  } else if (pageTitle.includes("Health") || pageTitle.includes("Sanitation")) {
    pageType = "Public Health & Sanitation";
  }

  // Create content for all platforms
  let content = `${pageType} Selection:\n\n`;
  let totalItems = 0;

  selectedProducts.forEach((product) => {
    content += `• ${product.name} - Quantity: ${product.quantity}\n`;
    totalItems += product.quantity;
  });

  content += `\nTotal Items: ${totalItems}\n\n`;
  content += "Please contact us for pricing and availability.";

  // Show contact options modal
  showContactOptionsModal(content);
}

// Show contact options modal
function showContactOptionsModal(content) {
  // Prevent automatic modal display
  if (!content || typeof content !== "string") {
    console.log(
      "showContactOptionsModal called without valid content - preventing execution"
    );
    return;
  }

  // Remove existing modal if any
  const existingModal = document.querySelector(".contact-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.className = "contact-modal";
  modal.style.display = "block"; // Force display
  modal.innerHTML = `
    <div class="contact-modal-content">
      <span class="close-modal" onclick="closeContactModal()">&times;</span>
      <h3>Choose Contact Method</h3>
      <div class="contact-options">
        <div class="contact-option" onclick="contactViaWhatsApp()">
          <div class="contact-option-icon whatsapp-icon">📱</div>
          <div class="contact-option-text">
            <div class="contact-option-title">WhatsApp</div>
            <div class="contact-option-subtitle">Send via WhatsApp</div>
          </div>
        </div>
        <div class="contact-option" onclick="contactViaCall()">
          <div class="contact-option-icon call-icon">📞</div>
          <div class="contact-option-text">
            <div class="contact-option-title">Call</div>
            <div class="contact-option-subtitle">Call us directly</div>
          </div>
        </div>
        <div class="contact-option" onclick="contactViaEmail()">
          <div class="contact-option-icon email-icon">✉️</div>
          <div class="contact-option-text">
            <div class="contact-option-title">Email</div>
            <div class="contact-option-subtitle">Send via email</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Store content for use in contact functions
  modal.dataset.content = content;

  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeContactModal();
    }
  });
}

// Close contact modal
function closeContactModal() {
  const modal = document.querySelector(".contact-modal");
  if (modal) {
    modal.remove();
  }
}

// Contact via WhatsApp
function contactViaWhatsApp() {
  const modal = document.querySelector(".contact-modal");
  const content = modal ? modal.dataset.content : "";
  const phoneNumber = "254729171831";

  // Check if we're on the homepage by checking the current URL path
  const currentPath = window.location.pathname;
  const isHomepage =
    currentPath === "/" || currentPath === "/index.html" || currentPath === "";

  let message;
  if (isHomepage) {
    message =
      "Hello! 👋 I'm interested in learning more about ARK Hygiene's protective gear and safety equipment. Could you please provide me with information about your products and pricing? Thank you! 🛡️";
  } else {
    message = content || "Hello, I'm interested in your products.";
  }

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
  window.open(whatsappUrl, "_blank");
  closeContactModal();
  showNotification("Opening WhatsApp...");
}

// Contact via Call
function contactViaCall() {
  const phoneNumber = "254729171831";
  window.open(`tel:${phoneNumber}`, "_self");
  closeContactModal();
  showNotification("Opening phone dialer...");
}

// Contact via Email
function contactViaEmail() {
  const modal = document.querySelector(".contact-modal");
  const content = modal ? modal.dataset.content : "";
  const subject = "Product Selection Inquiry";
  const emailBody = content || "Hello, I'm interested in your products.";
  const mailtoLink = `mailto:info@arksafety.biz?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(emailBody)}`;
  window.open(mailtoLink, "_blank");
  closeContactModal();
  showNotification("Opening email client...");
}

// Update selection counter
function updateSelectionCounter() {
  const counter = document.getElementById("selectedCount");
  const sendBtn = document.querySelector(".send-selection-btn");

  if (counter) {
    counter.textContent = selectedProducts.length;

    // Show/hide the count badge based on selection
    if (selectedProducts.length > 0) {
      counter.classList.remove("hidden");
    } else {
      counter.classList.add("hidden");
    }
  }

  // Update send button state
  if (sendBtn) {
    if (selectedProducts.length > 0) {
      sendBtn.disabled = false;
      sendBtn.style.opacity = "1";
      sendBtn.style.cursor = "pointer";
    } else {
      sendBtn.disabled = true;
      sendBtn.style.opacity = "1"; // Keep visible but disabled
      sendBtn.style.cursor = "not-allowed";
    }
  }
}

// Filter products by category
function filterProducts(category, event) {
  currentFilter = category;

  // Close dropdown after selection
  const categoryDropdown = document.querySelector(".category-dropdown");
  if (categoryDropdown) {
    categoryDropdown.classList.remove("active");
  }

  // Update dropdown button text to show current filter
  const dropdownBtn = document.querySelector(".dropdown-btn");
  const categoryNames = {
    all: "All Medical Equipment",
    specimen: "Specimen Bags & Containers",
    sterilization: "Sterilization Equipment",
    sharps: "Sharp Containers",
    bins: "Waste Bins",
    sanitary: "Sanitary Bins",
    tissue: "Tissue Dispensers",
    biohazard: "Biohazard Spill Kits",
    cytotoxic: "Cytotoxic Spill Kits",
    bodily: "Bodily Fluid Spill Kits",
    cleaning: "Cleaning Equipment",
    disinfectants: "Disinfectants",
    linen: "Linen & Covers",
  };
  if (dropdownBtn && categoryNames[category]) {
    dropdownBtn.textContent = categoryNames[category] + " ▼";
  }

  // Update active state in dropdown
  const dropdownLinks = document.querySelectorAll(".dropdown-content a");
  dropdownLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.onclick.toString().includes(category)) {
      link.classList.add("active");
    }
  });

  // Show/hide products with optimized DOM manipulation
  const products = document.querySelectorAll(".product-item");
  const shouldShow = category === "all";
  const visibleProducts = [];

  products.forEach((product) => {
    const isVisible = shouldShow || product.dataset.category === category;
    product.style.display = isVisible ? "block" : "none";
    product.style.opacity = isVisible ? "1" : "0";
    product.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";

    if (isVisible) {
      visibleProducts.push(product);
    }
  });

  // Adjust grid layout based on visible product count
  const gallery = document.querySelector(".product-gallery");
  const visibleCount = visibleProducts.length;

  if (visibleCount === 1) {
    gallery.style.gridTemplateColumns = "1fr";
    gallery.style.maxWidth = "100%";
    gallery.style.marginLeft = "0";
    gallery.style.marginRight = "0";
  } else if (visibleCount === 2) {
    gallery.style.gridTemplateColumns = "repeat(2, 1fr)";
    gallery.style.maxWidth = "600px";
    gallery.style.marginLeft = "auto";
    gallery.style.marginRight = "auto";
  } else if (visibleCount === 3) {
    gallery.style.gridTemplateColumns = "repeat(3, 1fr)";
    gallery.style.maxWidth = "900px";
    gallery.style.marginLeft = "auto";
    gallery.style.marginRight = "auto";
  } else if (visibleCount === 4) {
    gallery.style.gridTemplateColumns = "repeat(4, 1fr)";
    gallery.style.maxWidth = "1200px";
    gallery.style.marginLeft = "auto";
    gallery.style.marginRight = "auto";
  } else if (visibleCount === 5 || visibleCount === 6) {
    gallery.style.gridTemplateColumns = "repeat(3, 1fr)";
    gallery.style.maxWidth = "900px";
    gallery.style.marginLeft = "auto";
    gallery.style.marginRight = "auto";

    // Make last product stretch to full width
    const lastProduct = visibleProducts[visibleProducts.length - 1];
    if (lastProduct) {
      lastProduct.style.gridColumn = "1 / -1";
      lastProduct.style.maxWidth = "100%";
      lastProduct.style.width = "100%";
    }
  } else {
    gallery.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";
    gallery.style.maxWidth = "none";
    gallery.style.marginLeft = "0";
    gallery.style.marginRight = "0";
  }

  // Reset selections when filtering
  if (category !== "all") {
    selectedProducts = [];
    const selectedItems = document.querySelectorAll(".product-item.selected");
    selectedItems.forEach((item) => item.classList.remove("selected"));
    updateSelectionCounter();
  }
}

// Show product details (placeholder function)
function showProductDetails(productId) {
  const productNames = {
    "specimen-bags": "Specimen Bags & Containers",
    "specimen-containers": "Specimen Containers",
    autoclave: "Medical Waste Autoclave",
    "autoclave-shredder": "Autoclave with Shredder",
    macerator: "Medical Waste Macerator",
    incinerator: "Diesel Fired Incinerator",
    "sharp-1.4l": "Sharp Container 1.4L",
    "sharp-2l": "Sharp Container 2L",
    "sharp-4l": "Sharp Container 4L",
    "sharp-4.6l": "Sharp Container 4.6L",
    "sharp-5l-box": "Sharp Container 5L Sharp Box",
    "sharp-5l": "Sharp Container 5L",
    "sharp-6l": "Sharp Container 6L",
    "sharp-8l": "Sharp Container 8L",
    "pedal-bin-18l": "Pedal Bin 18L",
    "pedal-bin-20l": "Pedal Bin 20L",
    "pedal-bin-25l": "Pedal Bin 25L",
    "pedal-bin-30l": "Pedal Bin 30L",
    "pedal-bin-50l": "Pedal Bin 50L",
    "pedal-bin-100l": "Pedal Bin 100L",
    "waste-bin-90l": "Waste Bin 90L",
    "waste-bin-120l": "Waste Bin 120L",
    "waste-bin-240l": "Waste Bin 240L",
    "waste-bin-360l": "Waste Bin 360L",
    "trolley-bin-120l": "Trolley Bin 120L",
    "trolley-bin-750l": "Trolley Bin 750L",
    "trolley-bin-1100l": "Trolley Bin 1100L",
    "sanitary-automatic": "Automatic Sanitary Bin",
    "sanitary-manual": "Manual Sanitary Bin",
    "sanitary-400ml": "Sanitary Bin 400ml",
    "sanitary-800ml": "Sanitary Bin 800ml",
    "sanitary-1l": "Sanitary Bin 1L",
    "paper-towel-dispenser": "Paper Towel Dispenser",
    "toilet-paper-dispenser": "Toilet Paper Dispenser",
    "biohazard-spill-kit": "Biohazard Spill Kit",
    "cytotoxic-spill-kit": "Cytotoxic Spill Kit",
    "bodily-fluid-spill-kit": "Bodily Fluid Spill Kit",
    "general-spill-kit": "General Spill Kit",
    "cleaning-mops": "Cleaning Mops",
    "cleaning-buckets": "Cleaning Buckets",
    "cleaning-trolley": "Cleaning Trolley",
    "window-squeezer": "Window Cleaner Squeezer",
    "portex-spray": "Portex Disinfectant Spray",
    "clorox-wipes": "Clorox Disinfecting Wipes",
    "parker-spray": "Parker Portex Disinfectant Sprays",
    "hospital-sheets": "Hospital Bed Sheets",
    "hospital-counterpanes": "Hospital Counterpanes",
    "cellular-blankets": "Cellular Blankets",
    "first-aid-kit": "First Aid Kit",
  };

  const productName = productNames[productId] || "Product";
  showNotification(
    `Details for ${productName} - Contact us for more information!`
  );
}

// Performance-optimized notification system
let notificationTimeout;
let notificationQueue = [];

function showNotification(message) {
  notificationQueue.push(message);
  if (notificationQueue.length === 1) {
    showNextNotification();
  }
}

function showNextNotification() {
  if (notificationQueue.length === 0) return;

  const message = notificationQueue.shift();
  const notification = document.createElement("div");
  notification.className = "performance-notification";
  notification.textContent = message;

  // Mobile-specific adjustments
  let isMobile = window.innerWidth <= 768;

  // Use CSS classes instead of inline styles for better performance
  notification.style.cssText = `
    position: fixed;
    top: ${isMobile ? "10px" : "15px"};
    right: ${isMobile ? "10px" : "15px"};
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: ${isMobile ? "8px 12px" : "10px 15px"};
    border-radius: ${isMobile ? "4px" : "6px"};
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    font-size: ${isMobile ? "0.8rem" : "0.85rem"};
    max-width: ${isMobile ? "150px" : "200px"};
    transform: translateX(100%);
    transition: transform 0.3s ease;
    will-change: transform;
  `;

  document.body.appendChild(notification);

  // Use requestAnimationFrame for smooth animations
  requestAnimationFrame(() => {
    notification.style.transform = "translateX(0)";
  });

  // Remove immediately after appearing
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
      showNextNotification();
    }, 300);
  }, 500);
}

// Show contact modal function
function showContactModal() {
  const pageTitle = document.title || "";

  // Check if we're on the homepage by checking the current URL path
  const currentPath = window.location.pathname;
  const isHomepage =
    currentPath === "/" || currentPath === "/index.html" || currentPath === "";

  let content;
  if (isHomepage) {
    content =
      "General Inquiry:\n\nI'm interested in learning more about ARK Hygiene's products and services.";
  } else {
    let pageType = "Product";
    if (pageTitle.includes("PPE") || pageTitle.includes("Safety")) {
      pageType = "PPE & Safety Gear";
    } else if (pageTitle.includes("Medical")) {
      pageType = "Medical Equipment";
    } else if (
      pageTitle.includes("Sterilization") ||
      pageTitle.includes("Waste")
    ) {
      pageType = "Sterilization & Waste Equipment";
    } else if (pageTitle.includes("Sanitary")) {
      pageType = "Sanitary Solutions";
    } else if (pageTitle.includes("Spill")) {
      pageType = "Spill Management";
    } else if (
      pageTitle.includes("Health") ||
      pageTitle.includes("Sanitation")
    ) {
      pageType = "Public Health & Sanitation";
    }
    content = `${pageType} Inquiry:\n\nPlease contact us for pricing and availability.`;
  }

  showContactOptionsModal(content);
}

// Handle contact form submission
function handleContactForm(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Get form values
  const name = formData.get("name") || "";
  const email = formData.get("email") || "";
  const phone = formData.get("phone") || "";
  const company = formData.get("company") || "";
  const subject = formData.get("subject") || "";
  const message = formData.get("message") || "";
  const equipmentType = formData.get("equipment-type") || "";
  const quantity = formData.get("quantity") || "";

  // Determine page type for subject
  const pageTitle = document.title || "";
  let pageType = "General Inquiry";

  if (pageTitle.includes("PPE") || pageTitle.includes("Safety")) {
    pageType = "PPE & Safety Gear";
  } else if (pageTitle.includes("Medical")) {
    pageType = "Medical Equipment";
  } else if (
    pageTitle.includes("Sterilization") ||
    pageTitle.includes("Waste")
  ) {
    pageType = "Sterilization & Waste Equipment";
  } else if (pageTitle.includes("Sanitary")) {
    pageType = "Sanitary Solutions";
  } else if (pageTitle.includes("Spill")) {
    pageType = "Spill Management";
  } else if (pageTitle.includes("Health") || pageTitle.includes("Sanitation")) {
    pageType = "Public Health & Sanitation";
  }

  // Build email subject and body
  const emailSubject = `ARK Hygiene - ${pageType} Inquiry from ${name}`;

  let emailBody = `New inquiry from ARK Hygiene website:\n\n`;
  emailBody += `Name: ${name}\n`;
  emailBody += `Email: ${email}\n`;
  if (phone) emailBody += `Phone: ${phone}\n`;
  if (company) emailBody += `Company: ${company}\n`;
  if (subject) emailBody += `Subject: ${subject}\n`;
  if (equipmentType) emailBody += `Equipment Type: ${equipmentType}\n`;
  if (quantity) emailBody += `Quantity: ${quantity}\n`;
  emailBody += `\nMessage:\n${message}\n\n`;
  emailBody += `Page: ${pageTitle}\n`;
  emailBody += `Date: ${new Date().toLocaleString()}`;

  // Create mailto link
  const mailtoLink = `mailto:mireyhen@gmail.com?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  // Open email client
  window.location.href = mailtoLink;

  // Show success notification
  showNotification(
    "Email client opened! Please send the email to complete your request."
  );

  // Reset form
  form.reset();
}

// Initialize page with performance optimizations
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing...");
  console.log("scrollToSection function available:", typeof scrollToSection);

  // Test if contact-us element exists
  const contactElement = document.getElementById("contact-us");
  console.log("Contact element found:", !!contactElement);
  if (contactElement) {
    console.log("Contact element ID:", contactElement.id);
  }

  // Remove any existing modals that might have been left over
  const existingModals = document.querySelectorAll(".contact-modal");
  existingModals.forEach((modal) => {
    console.log("Removing existing modal on page load");
    modal.remove();
  });

  // Clear any global variables that might cause issues
  if (typeof selectedProducts !== "undefined") {
    selectedProducts.length = 0;
  }

  updateSelectionCounter();

  // Dropdown functionality
  const dropdownBtn = document.querySelector(".dropdown-btn");
  const dropdownContent = document.querySelector(".dropdown-content");
  const categoryDropdown = document.querySelector(".category-dropdown");

  if (dropdownBtn && categoryDropdown) {
    dropdownBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      categoryDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (!categoryDropdown.contains(e.target)) {
        categoryDropdown.classList.remove("active");
      }
    });
  }

  // Use event delegation for better performance (desktop only)
  document.addEventListener("click", function (e) {
    // Only allow card clicking on desktop (not mobile)
    if (window.innerWidth > 768) {
      const productItem = e.target.closest(".product-item");
      if (
        productItem &&
        !e.target.classList.contains("btn-select") &&
        !e.target.classList.contains("btn-details") &&
        !e.target.closest(".quantity-selector")
      ) {
        const productId = productItem.dataset.product;
        const productName =
          productItem.querySelector(".product-name").textContent;
        selectProduct(productId, productName);
      }
    }
  });

  // Preload critical images
  const criticalImages = [
    "assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - autoclave.png",
    "assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - autoclave with shredder.png",
  ];

  criticalImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  var footerForm = document.querySelector(".footer-contact-form");
  if (footerForm) {
    footerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // Collect form data
      const name = footerForm.querySelector("#footer-name")?.value || "";
      const email = footerForm.querySelector("#footer-email")?.value || "";
      const phone = footerForm.querySelector("#footer-phone")?.value || "";
      const category =
        footerForm.querySelector("#footer-category")?.value || "";
      const units = footerForm.querySelector("#footer-units")?.value || "";
      const message = footerForm.querySelector("#footer-message")?.value || "";
      // Build content string
      let content = `Quote/Inquiry Request:\n`;
      if (name) content += `Name: ${name}\n`;
      if (email) content += `Email: ${email}\n`;
      if (phone) content += `Phone: ${phone}\n`;
      if (category) content += `Category: ${category}\n`;
      if (units) content += `Units: ${units}\n`;
      if (message) content += `Message: ${message}\n`;
      showContactOptionsModal(content);
    });
  }
});

// PC Navigation Functions
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Keyboard navigation for PC
function initializeKeyboardNavigation() {
  document.addEventListener("keydown", function (event) {
    // Arrow key scrolling
    if (event.key === "ArrowUp") {
      event.preventDefault();
      window.scrollBy({
        top: -100,
        behavior: "smooth",
      });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      window.scrollBy({
        top: 100,
        behavior: "smooth",
      });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      window.scrollBy({
        left: -100,
        behavior: "smooth",
      });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      window.scrollBy({
        left: 100,
        behavior: "smooth",
      });
    }

    // Page navigation
    if (event.key === "Home") {
      event.preventDefault();
      scrollToTop();
    } else if (event.key === "End") {
      event.preventDefault();
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }

    // Space bar for page down
    if (event.key === " " && !event.target.matches("input, textarea, select")) {
      event.preventDefault();
      window.scrollBy({
        top: window.innerHeight * 0.8,
        behavior: "smooth",
      });
    }

    // Escape key to close modals
    if (event.key === "Escape") {
      const modal = document.querySelector(".contact-modal");
      if (modal && modal.style.display === "flex") {
        closeContactModal();
      }
    }
  });
}

// Initialize keyboard navigation when page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeKeyboardNavigation();
});
