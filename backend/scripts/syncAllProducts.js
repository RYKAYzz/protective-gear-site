const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

// Product definitions based on assets folder analysis
const additionalProducts = [
  // Missing linen & covers
  {
    name: 'Blue Disposable Kallies Pad',
    slug: 'blue-disposable-kallies-pad',
    description: 'Disposable blue kallies pads for medical and clinical use',
    category: 'sanitary-solutions',
    image: 'assets/linen-covers/linen & covers - Blue disposable kallies pad.jpg'
  },
  {
    name: 'Disposable Draw Sheets',
    slug: 'disposable-draw-sheets',
    description: 'Disposable draw sheets for patient care and hygiene',
    category: 'sanitary-solutions', 
    image: 'assets/linen-covers/linen & covers - disposable draw sheets.jpg'
  },
  // Missing PPE items
  {
    name: 'Disposable Re-usable Face Masks',
    slug: 'disposable-reusable-face-masks',
    description: 'High-quality disposable and re-usable face masks for protection',
    category: 'ppe-safety-gear',
    image: 'assets/PPE-safety-gear/disposable re-usable face masks.png'
  },
  {
    name: 'Latex Powdered & Powder Free Gloves',
    slug: 'latex-powdered-powder-free-gloves',
    description: 'Medical grade latex gloves available in powdered and powder-free varieties',
    category: 'ppe-safety-gear',
    image: 'assets/PPE-safety-gear/latex powdered & powder free gloves.jpg'
  },
  // Additional waste bag variations from Cleaning-equipments folder
  {
    name: 'Clinical Waste Bag Yellow 18x24',
    slug: 'clinical-waste-bag-yellow-18x24',
    description: 'Yellow clinical waste polythene bag size 18x24 inches',
    category: 'sterilization-waste',
    image: 'assets/Cleaning-equipments/cleaning Equipments - size 18 * 24 color red.png'
  },
  {
    name: 'Clinical Waste Bag Yellow 20x30',
    slug: 'clinical-waste-bag-yellow-20x30',
    description: 'Yellow clinical waste polythene bag size 20x30 inches',
    category: 'sterilization-waste',
    image: 'assets/Cleaning-equipments/cleaning Equipments - size 20 by 30 color yellow.png'
  },
  {
    name: 'Clinical Waste Bag Yellow 36x50',
    slug: 'clinical-waste-bag-yellow-36x50',
    description: 'Yellow clinical waste polythene bag size 36x50 inches',
    category: 'sterilization-waste',
    image: 'assets/Cleaning-equipments/cleaning Equipments  - size 36 by 50 color yellow.jpg'
  },
  {
    name: 'Clinical Waste Bag Various Sizes',
    slug: 'clinical-waste-bag-various-sizes',
    description: 'Clinical waste polythene bags available in various sizes',
    category: 'sterilization-waste',
    image: 'assets/Cleaning-equipments/cleaning Equipments  - various sizes.png'
  },
  // Additional specimen bag
  {
    name: 'Specimen Bags & Containers - Type 2',
    slug: 'specimen-bags-containers-type-2',
    description: 'Secondary type of specimen bags and containers for medical samples',
    category: 'medical-equipment',
    image: 'assets/specimen-bags/pecimen bags & containers -2.png'
  }
];

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

async function syncAllProducts() {
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

    // Add additional products from assets folder
    console.log(`Adding ${additionalProducts.length} additional products from assets folder`);
    allProducts.push(...additionalProducts.map(p => ({
      productId: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      image: p.image
    })));

    console.log(`\nTotal products to sync: ${allProducts.length}`);

    // Insert all products into database
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      
      // Use provided image or try to find one
      let imagePath = product.image;
      
      if (!imagePath) {
        const imageExtensions = ['.png', '.jpg', '.jpeg'];
        
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
      }

      // Create unique slug to avoid duplicates
      let uniqueSlug = product.productId;
      let counter = 1;
      
      while (await Product.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${product.productId}-${counter}`;
        counter++;
      }

      // Create product document
      const productDoc = {
        name: product.name,
        slug: uniqueSlug,
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
      console.log(`Added: ${product.name} (slug: ${uniqueSlug})`);
    }

    console.log('\n=== SYNC COMPLETE ===');
    const totalProducts = await Product.countDocuments();
    console.log(`Total products in database: ${totalProducts}`);

    // Show breakdown by category
    const byCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nBy Category:');
    byCategory.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} products`);
    });

  } catch (error) {
    console.error('Error syncing products:', error);
  } finally {
    await mongoose.disconnect();
  }
}

syncAllProducts();
