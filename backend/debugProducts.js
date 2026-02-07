const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const path = require('path');
const fs = require('fs');

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);

        const output = [];
        const log = (msg) => {
            console.log(msg);
            output.push(msg);
        };

        const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        log(`Checking last ${products.length} products (newest first)`);

        products.forEach(p => {
            log(`Product: ${p.name}`);
            log(`  ID: ${p._id}`);
            log(`  Image URL: ${p.image_url}`);

            if (p.image_url) {
                // Handle potential different path separators or prefix issues
                let filename = p.image_url;
                if (filename.startsWith('/uploads/')) {
                    filename = filename.replace('/uploads/', '');
                } else if (filename.startsWith('uploads/')) {
                    filename = filename.replace('uploads/', '');
                }

                const updatePath = path.join(__dirname, 'uploads', filename);

                if (fs.existsSync(updatePath)) {
                    log(`  File exists: Yes (${filename})`);
                } else {
                    log(`  File exists: NO`);
                    log(`  Expected at: ${updatePath}`);
                }
            } else {
                log(`  No Image URL`);
            }
            log('---');
        });

        fs.writeFileSync('debug_report.txt', output.join('\n'));
        console.log('Report written to debug_report.txt');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debug();
