import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INVENTORY_DIR = path.join(__dirname, '..', 'public', 'inventory');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'localInventory.json');

function syncInventory() {
    console.log('Starting inventory sync...');

    if (!fs.existsSync(INVENTORY_DIR)) {
        console.error('Inventory directory not found:', INVENTORY_DIR);
        return;
    }

    const inventory = [];
    const categories = fs.readdirSync(INVENTORY_DIR).filter(f => fs.statSync(path.join(INVENTORY_DIR, f)).isDirectory());

    categories.forEach(category => {
        const categoryPath = path.join(INVENTORY_DIR, category);
        const products = fs.readdirSync(categoryPath).filter(f => fs.statSync(path.join(categoryPath, f)).isDirectory());

        products.forEach(productName => {
            const productPath = path.join(categoryPath, productName);
            const files = fs.readdirSync(productPath);

            let mainImage = null;
            const detailImages = [];

            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    const fileName = path.parse(file).name.toLowerCase();
                    const relativePath = `/inventory/${category}/${productName}/${file}`;

                    if (fileName === 'o') {
                        mainImage = relativePath;
                    } else if (fileName.startsWith('m')) {
                        detailImages.push(relativePath);
                    }
                }
            });

            if (mainImage) {
                inventory.push({
                    name: productName,
                    category: category,
                    brand: 'Shine Tech',
                    price: 2500, // Placeholder price
                    stock: 15, // Placeholder stock
                    image: mainImage,
                    detailImages: detailImages.sort(),
                    description: `Premium ${productName} available now at SHINE TECH. High-quality audio and performance guaranteed.`,
                    specs: ['Premium Build', 'Shine Tech Warranty', 'Quality Tested']
                });
            }
        });
    });

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(inventory, null, 2));
    console.log(`Successfully synced ${inventory.length} products to ${OUTPUT_FILE}`);
}

syncInventory();
