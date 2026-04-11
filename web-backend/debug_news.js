import mongoose from 'mongoose';
import { NewsCache } from './src/modules/news/news.repository.js';
const URI = 'mongodb+srv://tuannguyen10112004:tuannguyencoder@cluster0.xsi5t.mongodb.net/vic_system';

async function debug() {
  await mongoose.connect(URI);
  const news = await NewsCache.findOne().sort({ createdAt: -1 });
  console.log('--- RAW DB OBJECT ---');
  console.log(JSON.stringify(news ? news.toObject() : {}, null, 2));
  process.exit();
}
debug();
