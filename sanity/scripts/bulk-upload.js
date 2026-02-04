/**
 * Bulk Image Upload Script for Sanity Portfolio
 * 
 * Usage:
 * 1. Put your images in a folder
 * 2. Run: node scripts/bulk-upload.js <portfolio-slug> <folder-path>
 * 
 * Example:
 * node scripts/bulk-upload.js "joanna-darek" "C:\Photos\JoannaDarek"
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Sanity client configuration
const client = createClient({
    projectId: 'eulheo47',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_WRITE_TOKEN, // You need to set this!
    useCdn: false,
});

async function uploadImage(filePath) {
    const imageBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    console.log(`  Uploading: ${fileName}...`);

    const asset = await client.assets.upload('image', imageBuffer, {
        filename: fileName,
    });

    return {
        _type: 'image',
        _key: asset._id.replace('image-', ''),
        asset: {
            _type: 'reference',
            _ref: asset._id,
        },
    };
}

async function bulkUpload(portfolioSlug, folderPath) {
    console.log(`\n📁 Looking for images in: ${folderPath}`);

    // Get all image files
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const files = fs.readdirSync(folderPath)
        .filter(file => supportedExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(folderPath, file))
        .sort();

    console.log(`📷 Found ${files.length} images\n`);

    if (files.length === 0) {
        console.log('No images found!');
        return;
    }

    // Find portfolio document
    const portfolio = await client.fetch(
        `*[_type == "portfolio" && slug.current == $slug][0]`,
        { slug: portfolioSlug }
    );

    if (!portfolio) {
        console.log(`❌ Portfolio with slug "${portfolioSlug}" not found!`);
        return;
    }

    console.log(`✅ Found portfolio: ${portfolio.title}\n`);
    console.log(`Starting upload of ${files.length} images...\n`);

    // Upload all images
    const uploadedImages = [];
    for (let i = 0; i < files.length; i++) {
        try {
            const imageRef = await uploadImage(files[i]);
            uploadedImages.push(imageRef);
            console.log(`  ✓ ${i + 1}/${files.length} done`);
        } catch (error) {
            console.error(`  ✗ Failed: ${files[i]}`, error.message);
        }
    }

    console.log(`\n📝 Updating portfolio document...`);

    // Update portfolio with new images (append to existing)
    const existingImages = portfolio.images || [];
    await client
        .patch(portfolio._id)
        .set({ images: [...existingImages, ...uploadedImages] })
        .commit();

    console.log(`\n🎉 Done! Added ${uploadedImages.length} images to "${portfolio.title}"`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           Bulk Image Upload for Sanity Portfolio           ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Usage:                                                    ║
║    node scripts/bulk-upload.js <slug> <folder>             ║
║                                                            ║
║  Example:                                                  ║
║    node scripts/bulk-upload.js "sesja" "C:\\Photos\\Sesja" ║
║                                                            ║
║  Before running, set your Sanity token:                    ║
║    set SANITY_WRITE_TOKEN=your-token-here                  ║
║                                                            ║
║  Get your token from:                                      ║
║    https://sanity.io/manage → Project → API → Tokens       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
    process.exit(1);
}

const [portfolioSlug, folderPath] = args;

if (!process.env.SANITY_WRITE_TOKEN) {
    console.error('\n❌ Error: SANITY_WRITE_TOKEN environment variable is not set!');
    console.log('\nTo set it, run:');
    console.log('  set SANITY_WRITE_TOKEN=your-token-here\n');
    console.log('Get your token from: https://sanity.io/manage → Your Project → API → Tokens');
    console.log('Create a token with "Editor" or "Deploy Studio" permissions.\n');
    process.exit(1);
}

bulkUpload(portfolioSlug, folderPath).catch(console.error);
