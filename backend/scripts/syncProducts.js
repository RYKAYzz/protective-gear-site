const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

// HTML file to category mapping
const categoryFiles = {
  'ppe-safety-gear.html': 'ppe-safety-gear',
  'medical-equipment.html': 'medical-equipment', 
  'sterilization-waste-equipment.html': 'sterilization-waste',
  'sanitary-solutions.html': 'sanitary-solutions',
  'spill-management.html': 'spill-management',
  'public-health-sanitation.html': 'public-health-sanitation'
};

// Extract products from HTML files
function extractProductsFromHTML(htmlContent, category) {
  const products = [];
  const productRegex = /data-product="([^"]+)"[^>]*>[\s\S]*?(?:<h3|<p) class="product-name">([^<]+)<\/(?:h3|p)>[\s\S]*?<p class="product-description">([^<]+)</g;
  
  let match;
  while ((match = productRegex.exec(htmlContent)) !== null) {
    products.push({
      productId: match[1],
      name: match[2].trim(),
      description: match[3].trim(),
      category: category
    });
  }
  
  return products;
}

async function syncProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ark-hygiene');
    console.log('Connected to database');

    // Clear existing products to avoid duplicates
    await Product.deleteMany({});
    console.log('Cleared existing products');

    const allProducts = [];
    const parentDir = path.join(__dirname, '../..');

    // Process each HTML file
    for (const [filename, category] of Object.entries(categoryFiles)) {
      const filePath = path.join(parentDir, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        continue;
      }

      const htmlContent = fs.readFileSync(filePath, 'utf8');
      const products = extractProductsFromHTML(htmlContent, category);
      
      console.log(`Found ${products.length} products in ${filename}`);
      allProducts.push(...products);
    }

    console.log(`\nTotal products to sync: ${allProducts.length}`);

    // Insert all products into database
    for (const product of allProducts) {
      // Find corresponding image
      const imageExtensions = ['.png', '.jpg', '.jpeg'];
      let imagePath = '';
      
      // Try to find image in assets folders
      for (const ext of imageExtensions) {
        const possiblePaths = [
          `assets/${product.category}/${product.productId}${ext}`,
          `assets/${product.category}/${product.productId.replace(/-/g, ' ')}${ext}`,
          `assets/${product.category}/${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}${ext}`
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(path.join(parentDir, possiblePath))) {
            imagePath = possiblePath;
            break;
          }
        }
        if (imagePath) break;
      }

      // Create product document
      const productDoc = {
        name: product.name,
        slug: product.productId,
        description: product.description,
        category: product.category,
        image: imagePath || `assets/${product.category}/placeholder.png`,
        images: [],
        price: 0,
        currency: 'KES',
        stock: 100,
        inStock: true,
        featured: false,
        active: true,
        specifications: new Map(),
        tags: [],
        seoTitle: product.name,
        seoDescription: product.description
      };

      await Product.create(productDoc);
      console.log(`Added: ${product.name}`);
    }

    console.log('\n=== SYNC COMPLETE ===');
    const totalProducts = await Product.countDocuments();
    console.log(`Total products in database: ${totalProducts}`);

  } catch (error) {
    console.error('Error syncing products:', error);
  } finally {
    await mongoose.disconnect();
  }
}

syncProducts();
