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

    // Get product details for localStorage
    const productImage = productItem.querySelector(".product-image").src;
    const productDescription = productItem.querySelector(
      ".product-description"
    ).textContent;
    const productCategory = productItem.getAttribute("data-category");

    selectedProducts.push({
      id: productId,
      name: productName,
      quantity: 50,
      image: productImage,
      description: productDescription,
      category: productCategory,
    });

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

  // Save to localStorage
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  updateSelectionCounter();
  // Silent update - no notification for selection
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

    // Save to localStorage
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
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
    showNotificationPopup(
      "No Products Selected",
      "Please select at least one product before sending.",
      "error"
    );
    return;
  }

  if (selectedProducts.length === 0) {
    showNotificationPopup(
      "No Products Selected",
      "Please select at least one product before sending.",
      "error"
    );
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

// Show contact options modal with inquiry form
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
  
  // Detect page type for subject
  const pageTitle = document.title || "";
  let pageType = "Product";
  if (pageTitle.includes("PPE") || pageTitle.includes("Safety")) {
    pageType = "PPE & Safety Gear";
  } else if (pageTitle.includes("Medical")) {
    pageType = "Medical Equipment";
  } else if (pageTitle.includes("Sterilization") || pageTitle.includes("Waste")) {
    pageType = "Sterilization & Waste Equipment";
  } else if (pageTitle.includes("Sanitary")) {
    pageType = "Sanitary Solutions";
  } else if (pageTitle.includes("Spill")) {
    pageType = "Spill Management";
  } else if (pageTitle.includes("Health") || pageTitle.includes("Sanitation")) {
    pageType = "Public Health & Sanitation";
  }

  modal.innerHTML = `
    <div class="contact-modal-content" style="max-width: 550px; padding: 40px; border: 1px solid #ddd; border-radius: 10px; background: #ffffff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
      <span class="close-modal" onclick="closeContactModal()" style="position: absolute; top: 15px; right: 15px; font-size: 28px; font-weight: bold; color: #999; cursor: pointer; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; transition: color 0.3s ease;">&times;</span>
      <h3 style="margin: 0 0 25px 0; font-size: 1.5rem; font-weight: 700; color: #222; border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; letter-spacing: -0.5px; font-family: 'Poppins', sans-serif;">Submit Product Inquiry</h3>
      <p style="margin-bottom: 30px; color: #666; font-size: 0.9rem; line-height: 1.6; font-family: 'Roboto', sans-serif;">Please provide your contact information to submit your product selection inquiry.</p>
      <form id="productInquiryForm" onsubmit="submitProductInquiry(event)">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #333; font-family: 'Roboto', sans-serif;">Name *</label>
          <input type="text" id="inquiryName" name="name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #ffffff; color: #222; font-size: 1rem; box-sizing: border-box; font-family: 'Roboto', sans-serif; transition: all 0.3s ease;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #333; font-family: 'Roboto', sans-serif;">Email *</label>
          <input type="email" id="inquiryEmail" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #ffffff; color: #222; font-size: 1rem; box-sizing: border-box; font-family: 'Roboto', sans-serif; transition: all 0.3s ease;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #333; font-family: 'Roboto', sans-serif;">Phone</label>
          <input type="tel" id="inquiryPhone" name="phone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #ffffff; color: #222; font-size: 1rem; box-sizing: border-box; font-family: 'Roboto', sans-serif; transition: all 0.3s ease;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #333; font-family: 'Roboto', sans-serif;">Company</label>
          <input type="text" id="inquiryCompany" name="company" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #ffffff; color: #222; font-size: 1rem; box-sizing: border-box; font-family: 'Roboto', sans-serif; transition: all 0.3s ease;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #333; font-family: 'Roboto', sans-serif;">Message</label>
          <textarea id="inquiryMessage" name="message" readonly style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #f5f5f5; color: #222; font-size: 0.95rem; box-sizing: border-box; font-family: 'Roboto', sans-serif; resize: none; overflow-y: auto; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;"></textarea>
        </div>
        <button type="submit" id="submitInquiryBtn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8ec5fc 0%, #4a90e2 100%); color: #222; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.4s ease; margin-bottom: 20px; position: relative; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 2px 8px rgba(142, 197, 252, 0.18); font-family: 'Poppins', sans-serif;">
          <span id="submitBtnText">Submit Inquiry</span>
          <span id="submitBtnSpinner" style="display: none; font-size: 0.9rem; opacity: 0.8;">Loading...</span>
        </button>
        <p style="text-align: center; margin: 20px 0 15px 0; font-size: 0.85rem; color: #666; font-family: 'Roboto', sans-serif;">Or contact us via:</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button type="button" onclick="contactViaWhatsApp()" style="flex: 1; padding: 10px; background: #25D366; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; font-family: 'Roboto', sans-serif;">WhatsApp</button>
          <button type="button" onclick="contactViaCall()" style="flex: 1; padding: 10px; background: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; font-family: 'Roboto', sans-serif;">Call</button>
          <button type="button" onclick="contactViaEmail()" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; font-family: 'Roboto', sans-serif;">Email</button>
        </div>
      </form>
    </div>
  `;
  
  // Add focus styles and auto-size textarea
  document.body.appendChild(modal);
  
  // Set textarea content and auto-size it
  const textarea = modal.querySelector('#inquiryMessage');
  if (textarea) {
    textarea.value = content;
    // Auto-size textarea to fit content
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    // Ensure minimum height but allow growth
    textarea.style.minHeight = '120px';
    textarea.style.maxHeight = '400px';
  }
  
  // Add focus styles to inputs
  const inputs = modal.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.borderColor = '#4a90e2';
      this.style.outline = 'none';
      this.style.boxShadow = '0 0 8px rgba(74, 144, 226, 0.2)';
    });
    input.addEventListener('blur', function() {
      this.style.borderColor = '#ddd';
      this.style.boxShadow = 'none';
    });
  });
  
  // Add hover styles to submit button
  const submitBtn = modal.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('mouseenter', function() {
      this.style.background = 'linear-gradient(135deg, #4a90e2 0%, #8ec5fc 100%)';
      this.style.boxShadow = '0 4px 16px rgba(142, 197, 252, 0.28)';
    });
    submitBtn.addEventListener('mouseleave', function() {
      this.style.background = 'linear-gradient(135deg, #8ec5fc 0%, #4a90e2 100%)';
      this.style.boxShadow = '0 2px 8px rgba(142, 197, 252, 0.18)';
    });
  }
  
  // Add hover styles to contact buttons
  const contactBtns = modal.querySelectorAll('button[type="button"]');
  contactBtns.forEach(btn => {
    const originalBg = window.getComputedStyle(btn).backgroundColor;
    btn.addEventListener('mouseenter', function() {
      if (this.textContent === 'WhatsApp') {
        this.style.background = '#128C7E';
      } else if (this.textContent === 'Call') {
        this.style.background = '#357ABD';
      } else if (this.textContent === 'Email') {
        this.style.background = '#555';
      }
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    btn.addEventListener('mouseleave', function() {
      if (this.textContent === 'WhatsApp') {
        this.style.background = '#25D366';
      } else if (this.textContent === 'Call') {
        this.style.background = '#4a90e2';
      } else if (this.textContent === 'Email') {
        this.style.background = '#666';
      }
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });

  // Store content and page type for use in contact functions
  modal.dataset.content = content;
  modal.dataset.pageType = pageType;

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeContactModal();
    }
  });
}

// Submit product inquiry to backend
async function submitProductInquiry(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitBtnText = form.querySelector('#submitBtnText');
  const submitBtnSpinner = form.querySelector('#submitBtnSpinner');
  const originalText = submitBtnText ? submitBtnText.textContent : submitBtn.textContent;
  
  // Show loading state
  if (submitBtnText) {
    submitBtnText.textContent = "Submitting...";
  } else {
    submitBtn.textContent = "Submitting...";
  }
  
  if (submitBtnSpinner) {
    submitBtnSpinner.style.display = "inline";
  }
  
  submitBtn.disabled = true;
  submitBtn.style.opacity = "0.7";
  submitBtn.style.cursor = "not-allowed";

  const modal = document.querySelector(".contact-modal");
  const pageType = modal ? modal.dataset.pageType : "Product";
  const content = modal ? modal.dataset.content : "";

  // Get product category from page type
  let productCategory = "";
  if (pageType.includes("PPE")) {
    productCategory = "ppe-safety-gear";
  } else if (pageType.includes("Medical")) {
    productCategory = "medical-equipment";
  } else if (pageType.includes("Sterilization") || pageType.includes("Waste")) {
    productCategory = "sterilization-waste";
  } else if (pageType.includes("Sanitary")) {
    productCategory = "sanitary-solutions";
  } else if (pageType.includes("Spill")) {
    productCategory = "spill-management";
  } else if (pageType.includes("Health") || pageType.includes("Sanitation")) {
    productCategory = "public-health-sanitation";
  }

  // Calculate total quantity
  let totalQuantity = 0;
  if (selectedProducts && selectedProducts.length > 0) {
    totalQuantity = selectedProducts.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0);
  }

  const inquiryData = {
    name: document.getElementById("inquiryName").value,
    email: document.getElementById("inquiryEmail").value,
    phone: document.getElementById("inquiryPhone").value || "",
    company: document.getElementById("inquiryCompany").value || "",
    subject: "quote-request",
    message: document.getElementById("inquiryMessage").value || content,
    status: "new"
  };

  // Only include optional fields if they have values
  if (productCategory && productCategory.trim() !== "") {
    inquiryData.productCategory = productCategory;
  }
  if (totalQuantity > 0) {
    inquiryData.quantity = totalQuantity.toString();
  }
  inquiryData.urgency = "standard"; // Default value is valid

  try {
    // Check if API is loaded
    if (typeof api === 'undefined') {
      // Load API client if not available
      const script = document.createElement('script');
      script.src = 'js/api.js';
      script.onload = async () => {
        await submitInquiryToAPI(inquiryData);
      };
      document.head.appendChild(script);
      return;
    }

    // Check if backend API is available
    if (typeof api === 'undefined') {
      showNotificationPopup(
        "Backend Not Available",
        "The backend system is currently being updated. Please contact us directly at +254716253184 or email info@arkhygienesolutions.com",
        "error"
      );
      return;
    }

    const response = await api.createInquiry(inquiryData);

    if (response.success) {
      showNotificationPopup(
        "Inquiry Submitted Successfully",
        "Thank you for your inquiry. We'll get back to you soon.",
        "success"
      );
      closeContactModal();
      
      // Clear selections
      selectedProducts = [];
      localStorage.removeItem("selectedProducts");
      updateSelectionCounter();
      
      // Clear form
      form.reset();
    } else {
      throw new Error(response.message || "Failed to submit inquiry");
    }
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    showNotificationPopup(
      "Error",
      "Error submitting inquiry. Please try again or contact us directly.",
      "error"
    );
  } finally {
    // Reset button state
    if (submitBtnText) {
      submitBtnText.textContent = originalText;
    } else {
      submitBtn.textContent = originalText;
    }
    
    if (submitBtnSpinner) {
      submitBtnSpinner.style.display = "none";
    }
    
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    submitBtn.style.cursor = "pointer";
  }
}

// Helper function to submit inquiry when API is loaded
async function submitInquiryToAPI(inquiryData) {
  // Check if backend API is available
  if (typeof api === 'undefined') {
    showNotificationPopup(
      "Backend Not Available",
      "The backend system is currently being updated. Please contact us directly at +254716253184 or email info@arkhygienesolutions.com",
      "error"
    );
    return;
  }

  const response = await api.createInquiry(inquiryData);
  if (response.success) {
    showNotificationPopup(
      "Inquiry Submitted Successfully",
      "Thank you for your inquiry. We'll get back to you soon.",
      "success"
    );
    closeContactModal();
    selectedProducts = [];
    localStorage.removeItem("selectedProducts");
    updateSelectionCounter();
  }
}

// Custom Notification Popup Functions
function showNotificationPopup(title, message, type = "success") {
  const overlay = document.getElementById("notificationOverlay");
  const popup = document.getElementById("notificationPopup");
  const titleEl = document.getElementById("notificationTitle");
  const messageEl = document.getElementById("notificationMessage");

  if (!overlay || !popup || !titleEl || !messageEl) {
    // Fallback to alert if popup elements don't exist
    alert(`${title}\n\n${message}`);
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Remove previous type classes
  popup.classList.remove("success", "error");
  popup.classList.add(type);

  overlay.classList.add("active");

  // Close on overlay click
  overlay.addEventListener("click", function closeOnOverlayClick(e) {
    if (e.target === overlay) {
      closeNotificationPopup();
      overlay.removeEventListener("click", closeOnOverlayClick);
    }
  });

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeNotificationPopup();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

function closeNotificationPopup() {
  const overlay = document.getElementById("notificationOverlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
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
  const phoneNumber = "254716253184";

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
  // Silent - no notification needed for WhatsApp opening
}

// Contact via Call
function contactViaCall() {
  const phoneNumber = "254716253184";
  window.open(`tel:${phoneNumber}`, "_self");
  closeContactModal();
  // Silent - no notification needed for phone dialer opening
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
  // Silent - no notification needed for email client opening
}

// Load selected products from localStorage
function loadSelectedProductsFromStorage() {
  const storedProducts = localStorage.getItem("selectedProducts");
  if (storedProducts) {
    selectedProducts = JSON.parse(storedProducts);

    // Update visual state of selected products
    selectedProducts.forEach((product) => {
      const productItem = document.querySelector(
        `[data-product="${product.id}"]`
      );
      if (productItem) {
        productItem.classList.add("selected");

        // Add quantity input if not already present
        const existingQuantity =
          productItem.querySelector(".quantity-selector");
        if (!existingQuantity) {
          const productActions = productItem.querySelector(".product-actions");
          const quantityDiv = document.createElement("div");
          quantityDiv.className = "quantity-selector show";
          quantityDiv.innerHTML = `
            <label class="quantity-label">Quantity:</label>
            <input type="number" min="10" value="${product.quantity}" class="quantity-input" 
                   onchange="updateQuantity('${product.id}', this.value)"
                   onclick="event.stopPropagation()">
          `;
          productActions.appendChild(quantityDiv);
        }
      }
    });
  }
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

  // Product details are shown in the modal, no notification needed
}

// Legacy notification system - kept for backwards compatibility but deprecated
// Use showNotificationPopup instead
let notificationTimeout;
let notificationQueue = [];

function showNotification(message) {
  // Use new popup system instead
  showNotificationPopup("Notification", message, "success");
  return;
  
  // Old code below (deprecated)
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
  const mailtoLink = `mailto:info@arkhygienesolutions.com?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  // Open email client
  window.location.href = mailtoLink;

  // Email client will open automatically, no notification needed

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

  // Load selected products from localStorage
  loadSelectedProductsFromStorage();

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
