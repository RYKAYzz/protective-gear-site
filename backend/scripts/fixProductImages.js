const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

// Image mapping based on actual files in assets folder
const imageMappings = {
  // PPE Safety Gear
  'Head Cover': 'assets/PPE-safety-gear/head cover.png',
  'Face Shield': 'assets/PPE-safety-gear/face shield.png',
  'Safety Goggles': 'assets/PPE-safety-gear/safety google.png',
  'Disposable Face Masks': 'assets/PPE-safety-gear/disposable re-usable face masks.png',
  'Latex Gloves': 'assets/PPE-safety-gear/latex powdered & powder free gloves.jpg',
  'Heavy Duty Rubber Gloves - Short': 'assets/PPE-safety-gear/heavy duty rubber gloves-short.png',
  'Heavy Duty Rubber Gloves - Long': 'assets/PPE-safety-gear/heavy duty rubber Gloves- long.png',
  'Safety Boots': 'assets/PPE-safety-gear/safety boots.png',
  'Sanitary Clog': 'assets/PPE-safety-gear/sanitary clog.png',
  'Cover Shoes': 'assets/PPE-safety-gear/cover shoes.png',
  'Surgical Boots': 'assets/PPE-safety-gear/surgical boots.png',
  'Lab Coat': 'assets/PPE-safety-gear/lab coat.png',
  'Dust Coat': 'assets/PPE-safety-gear/dust coat.png',
  'Coverall': 'assets/PPE-safety-gear/coverall.png',
  'Disposable PVC Gown': 'assets/PPE-safety-gear/disposable pvc gown.png',
  'Surgical Gown': 'assets/PPE-safety-gear/surgical gown.png',
  
  // Medical Equipment
  'Specimen Bags & Containers': 'assets/specimen-bags/specimen bags & containers.png',
  'Specimen Containers': 'assets/specimen-bags/specimen bags & containers.png',
  
  // Sterilization & Waste Equipment
  'Medical Waste Autoclave': 'assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - autoclave.png',
  'Autoclave with Shredder': 'assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - autoclave with shredder.png',
  'Medical Waste Macerator': 'assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - Macerators.png',
  'Diesel Fired Incinerator': 'assets/Medical-waste-system/installations, repair and maintainance of medical waste equipments - diesel fried incinerator.png',
  
  // Sharp Containers
  'Sharp Container 1.4L': 'assets/Medical-waste-system/sharp containers - 1.4 litres.png',
  'Sharp Container 2L': 'assets/Medical-waste-system/sharp containers  - 2 litres.png',
  'Sharp Container 4L': 'assets/Medical-waste-system/sharp containers - 4 litres.png',
  'Sharp Container 4.6L': 'assets/Medical-waste-system/sharp containers - 4.6 litres.png',
  'Sharp Container 5L Sharp Box': 'assets/Medical-waste-system/sharp containers - 5 litres Sharp Box.png',
  'Sharp Container 5L': 'assets/Medical-waste-system/sharp containers 5 litres.png',
  'Sharp Container 6L': 'assets/Medical-waste-system/sharp containers - 6 litres.png',
  'Sharp Container 8L': 'assets/Medical-waste-system/sharp containers - 8 litres.png',
  
  // Bins
  'Pedal Bin 18L': 'assets/bins-wastes/pedal bins-18 litres.png',
  'Pedal Bin 20L': 'assets/bins-wastes/pedal bins-20 litres.png',
  'Pedal Bin 25L': 'assets/bins-wastes/pedal bins - 25 litres.png',
  'Pedal Bin 30L': 'assets/bins-wastes/pedal bins - 30 litres.png',
  'Pedal Bin 50L': 'assets/bins-wastes/pedal bins - 50 litres.png',
  'Pedal Bin 100L': 'assets/bins-wastes/pedal bins - 100 litres.jpg',
  'Waste Bin 90L': 'assets/bins-wastes/waste bins-90 litres.png',
  'Waste Bin 120L': 'assets/bins-wastes/waste bins - 120 litres.png',
  'Waste Bin 240L': 'assets/bins-wastes/waste bins - 240 litres.jpg',
  'Waste Bin 360L': 'assets/bins-wastes/waste bins - 360 litres.jpg',
  'Trolley Bin 120L': 'assets/bins-wastes/trolley bins - 120 litres.png',
  'Trolley Bin 750L': 'assets/bins-wastes/trolley bins-750 litres.png',
  'Trolley Bin 1100L': 'assets/bins-wastes/trolley bins - 1100 litres.jpg',
  
  // Waste Bags
  'Hospital Biohazard Polythene Bag - Red': 'assets/Medical-waste-system/cleaning Equipments  - size 20 by 36 color red.png',
  'Cytotoxic Waste Polythene Bag - Red': 'assets/Medical-waste-system/cleaning Equipments  - size 20 by 36 color red.png',
  'Clinical Waste Polythene Bag - Yellow 20x30': 'assets/Medical-waste-system/cleaning Equipments  - size 20 by 30 color yellow.png',
  'Clinical Waste Polythene Bag - Yellow 24x36': 'assets/Medical-waste-system/cleaning Equipments  - size 24 by 36 color yellow.png',
  'Sharps Disposal Polythene Bag - Blue 30x50': 'assets/Medical-waste-system/cleaning Equipments  - size 30 by 50 color blue light.png',
  'Clinical Waste Polythene Bag - Yellow 36x50': 'assets/Medical-waste-system/cleaning Equipments  - size 36 by 50 color yellow.jpg',
  'Medical Waste Polythene Bags - Various Sizes': 'assets/Medical-waste-system/cleaning Equipments  - various sizes.png',
  
  // Sanitary Solutions
  'Automatic Sanitary Bin': 'assets/sanitary-bins/sanitary bins -automatic.png',
  'Manual Sanitary Bin': 'assets/sanitary-bins/sanitary bins - manual.png',
  'Sanitary Bin 400ml': 'assets/sanitary-bins/sanitary bins - 400ml.png',
  'Sanitary Bin 800ml': 'assets/sanitary-bins/sanitary bins - 800ml.png',
  'Sanitary Bin 1L': 'assets/sanitary-bins/sanitary bins - 1 litres manual.png',
  'Cellular Blankets': 'assets/linen-covers/linen & covers - cellular blankets Multi colour.png',
  'Hospital Bed Sheets': 'assets/linen-covers/linen & covers - hospital bed sheets.png',
  'Hospital Counterpanes': 'assets/linen-covers/linen & covers - hospital counterpanes.png',
  'First Aid Kit': 'assets/linen-covers/First aid kit.png',
  'Blue Disposable Kallies Pad': 'assets/linen-covers/linen & covers - Blue disposable kallies pad.jpg',
  'Disposable Draw Sheets': 'assets/linen-covers/linen & covers - disposable draw sheets.jpg',
  
  // Cleaning Equipment
  'Cleaning Mops': 'assets/Cleaning-equipments/cleaning Equipments  - cleaning mops.png',
  'Cleaning Buckets': 'assets/Cleaning-equipments/cleaning Equipments  - cleaning buckets.png',
  'Cleaning Trolley': 'assets/Cleaning-equipments/cleaning Equipments  - cleaning trolley.png',
  'Window Cleaner Squeezer': 'assets/Cleaning-equipments/cleaning Equipments - window cleaner squeezer.png',
  
  // Disinfectants
  'Portex Disinfectant Spray': 'assets/Disinfectants/disinfectant spray portex.png',
  'Clorox Disinfecting Wipes': 'assets/Disinfectants/clorox disinfecting wipes.png',
  'Parker Portex Disinfectant Sprays': 'assets/Disinfectants/parker portex disinfectant sprays.png',
  
  // Spill Management
  'Biohazard Spill Kit': 'assets/spill-kits/spill kits & spill packs -  biohazard  spill kit.png',
  'Cytotoxic Spill Kit': 'assets/spill-kits/spill kits & spill packs -  cytotoxic spill pack.png',
  'Bodily Fluid Spill Kit': 'assets/spill-kits/spill kits & spill packs  - urine and vomit spil kit.png',
  'General Spill Kit': 'assets/spill-kits/spill kits & spill packs.png',
  
  // Paper Products
  'Paper Towel Dispenser': 'assets/tissue-dispensers/tissue dispensers  - paper towel dispenser.png',
  'Toilet Paper Dispenser': 'assets/tissue-dispensers/tissue dispensers - toilet Paper Dispenser.png',
  
  // Public Health & Sanitation
  'Portex Disinfectant Spray': 'assets/Disinfectants/disinfectant spray portex.png',
  'Clorox Disinfecting Wipes': 'assets/Disinfectants/clorox disinfecting wipes.png',
  'Parker Portex Disinfectant Sprays': 'assets/Disinfectants/parker portex disinfectant sprays.png'
};

async function fixProductImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ark-hygiene');
    console.log('Connected to database');

    const parentDir = path.join(__dirname, '../..');
    let updatedCount = 0;
    let notFoundCount = 0;

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    for (const product of products) {
      let newImagePath = imageMappings[product.name];
      
      if (newImagePath) {
        // Check if the image file actually exists
        const fullPath = path.join(parentDir, newImagePath);
        if (fs.existsSync(fullPath)) {
          // Update the product with the correct image path
          await Product.findByIdAndUpdate(product._id, { image: newImagePath });
          console.log(`Updated: ${product.name} -> ${newImagePath}`);
          updatedCount++;
        } else {
          console.log(`Image file not found: ${newImagePath} for product: ${product.name}`);
          notFoundCount++;
        }
      } else {
        // Try to find image by fuzzy matching
        const possibleExtensions = ['.png', '.jpg', '.jpeg'];
        let found = false;
        
        for (const ext of possibleExtensions) {
          const possibleNames = [
            product.name.toLowerCase().replace(/[^a-z0-9]/g, ' ') + ext,
            product.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + ext,
            product.slug + ext
          ];
          
          // Search in relevant asset folders
          const searchFolders = [
            `assets/${product.category}`,
            `assets/PPE-safety-gear`,
            `assets/Medical-waste-system`,
            `assets/Cleaning-equipments`,
            `assets/Disinfectants`,
            `assets/spill-kits`,
            `assets/sanitary-bins`,
            `assets/tissue-dispensers`,
            `assets/linen-covers`,
            `assets/specimen-bags`,
            `assets/bins-wastes`
          ];
          
          for (const folder of searchFolders) {
            for (const name of possibleNames) {
              const testPath = path.join(parentDir, folder, name);
              if (fs.existsSync(testPath)) {
                const relativePath = path.join(folder, name);
                await Product.findByIdAndUpdate(product._id, { image: relativePath });
                console.log(`Found by search: ${product.name} -> ${relativePath}`);
                updatedCount++;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
        
        if (!found) {
          console.log(`No image found for: ${product.name}`);
          notFoundCount++;
        }
      }
    }

    console.log('\n=== IMAGE FIX COMPLETE ===');
    console.log(`Updated: ${updatedCount} products`);
    console.log(`Not found: ${notFoundCount} products`);
    console.log(`Total processed: ${products.length} products`);

  } catch (error) {
    console.error('Error fixing product images:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixProductImages();
