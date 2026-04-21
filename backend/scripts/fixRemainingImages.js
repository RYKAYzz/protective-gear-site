const mongoose = require('mongoose');
const Product = require('../models/Product');

// Remaining image fixes
const remainingFixes = {
  'Pedal Bin 30L': 'assets/bins-wastes/pedal bins-30 litres.png',
  'Clinical Waste Polythene Bag - Yellow 20x30': 'assets/Medical-waste-system/cleaning Equipments - size 20 by 30 color yellow.png',
  'Medical Waste Polythene Bags - Various Sizes': 'assets/Medical-waste-system/cleaning Equipments - various sizes.png',
  'Disposable Re-usable Face Masks': 'assets/PPE-safety-gear/disposable re-usable face masks.png',
  'Latex Powdered & Powder Free Gloves': 'assets/PPE-safety-gear/latex powdered & powder free gloves.jpg',
  'Cytotoxic Spill Kit': 'assets/spill-kits/spill kits & spill packs - cytotoxic spill pack.png',
  
  // Use existing images for duplicates
  'Clinical Waste Bag Yellow 18x24': 'assets/Cleaning-equipments/cleaning Equipments - size 18 * 24 color red.png',
  'Clinical Waste Bag Yellow 20x30': 'assets/Cleaning-equipments/cleaning Equipments - size 20 by 30 color yellow.png',
  'Clinical Waste Bag Yellow 36x50': 'assets/Cleaning-equipments/cleaning Equipments  - size 36 by 50 color yellow.jpg',
  'Clinical Waste Bag Various Sizes': 'assets/Cleaning-equipments/cleaning Equipments  - various sizes.png',
  
  // Use specimen bags for type 2
  'Specimen Bags & Containers - Type 2': 'assets/specimen-bags/pecimen bags & containers -2.png',
  
  // Use variety pack for variety pack
  'Specimen Bags & Containers - Variety Pack': 'assets/specimen-bags/specimen bags & containers.png'
};

async function fixRemainingImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ark-hygiene');
    console.log('Connected to database');

    let updatedCount = 0;

    for (const [productName, imagePath] of Object.entries(remainingFixes)) {
      const product = await Product.findOne({ name: productName });
      
      if (product) {
        await Product.findByIdAndUpdate(product._id, { image: imagePath });
        console.log(`Updated: ${productName} -> ${imagePath}`);
        updatedCount++;
      } else {
        console.log(`Product not found: ${productName}`);
      }
    }

    console.log('\n=== REMAINING IMAGE FIX COMPLETE ===');
    console.log(`Updated: ${updatedCount} products`);

  } catch (error) {
    console.error('Error fixing remaining images:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixRemainingImages();
