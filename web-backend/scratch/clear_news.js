import 'dotenv/config.js';
import mongoose from 'mongoose';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const NewsCache = mongoose.model('NewsCache', new mongoose.Schema({}, {strict: false}), 'newscaches');
    const res = await NewsCache.deleteMany({});
    console.log("Deleted", res.deletedCount, "news items.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
