// Local Storage Management for Product Selections
// This file handles saving and restoring user selections across pages

// Storage keys
const STORAGE_KEYS = {
  SELECTED_PRODUCTS: "arkHygiene_selectedProducts",
  SELECTION_COUNT: "arkHygiene_selectionCount",
};

// Save selected products to local storage
function saveSelectedProducts() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SELECTED_PRODUCTS,
      JSON.stringify(selectedProducts)
    );
    localStorage.setItem(
      STORAGE_KEYS.SELECTION_COUNT,
      selectedProducts.length.toString()
    );
    console.log(
      "Selected products saved to local storage:",
      selectedProducts.length,
      "items"
    );
  } catch (error) {
    console.error("Error saving to local storage:", error);
  }
}

// Load selected products from local storage
function loadSelectedProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEYS.SELECTED_PRODUCTS);

    if (savedProducts) {
      selectedProducts = JSON.parse(savedProducts);
      console.log(
        "Loaded",
        selectedProducts.length,
        "products from local storage"
      );

      // Update UI to reflect loaded selections
      updateSelectionCounter();

      // Mark selected products visually
      selectedProducts.forEach((product) => {
        const productElement = document.querySelector(
          `[data-product="${product.id}"]`
        );
        if (productElement) {
          productElement.classList.add("selected");

          // Add quantity selector if quantity exists
          if (product.quantity && product.quantity > 0) {
            const productActions =
              productElement.querySelector(".product-actions");
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

      return true;
    }
  } catch (error) {
    console.error("Error loading from local storage:", error);
  }
  return false;
}

// Clear all saved selections
function clearSavedSelections() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SELECTION_COUNT);
    console.log("All saved selections cleared");
  } catch (error) {
    console.error("Error clearing local storage:", error);
  }
}

// Initialize storage functionality when page loads
function initializeStorage() {
  // Load saved selections when page loads
  loadSelectedProducts();

  // Add storage functionality to existing functions
  const originalSelectProduct = window.selectProduct;
  const originalUpdateQuantity = window.updateQuantity;
  const originalSendSelection = window.sendSelection;

  // Override selectProduct to include storage
  window.selectProduct = function (productId, productName) {
    originalSelectProduct(productId, productName);
    saveSelectedProducts();
  };

  // Override updateQuantity to include storage
  window.updateQuantity = function (productId, quantity) {
    originalUpdateQuantity(productId, quantity);
    saveSelectedProducts();
  };

  // Override sendSelection to include storage clearing
  window.sendSelection = function (event) {
    originalSendSelection(event);
    clearSavedSelections();
  };
}
