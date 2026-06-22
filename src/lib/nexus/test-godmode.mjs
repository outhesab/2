import { nexusExecutive } from './NexusExecutive.js';
import { logger } from '../../lib/logger.js';

// Mock DB for testing
const mockDB = {
  products: [{ id: 'p1', name: 'Döküm Soba', stock: 10, price: 5000, cost: 3000, deleted: false, minStock: 2 }],
  sales: [],
  cari: [{ id: 'c1', name: 'Ahmet Bey', balance: 0, type: 'musteri', deleted: false }],
  kasa: [],
  suppliers: [],
  orders: []
};

async function runTest(input) {
  console.log(`\n--- Testing Input: "${input}" ---`);
  try {
    const result = await nexusExecutive.execute(input, mockDB, { isFileContext: false });
    console.log('Result Type:', result.type);
    console.log('Response:', result.response);
    if (result.navigation) console.log('Navigation to:', result.navigation.path);
    if (result.executedActions) console.log('Actions:', result.executedActions);
  } catch (e) {
    console.error('Test Failed:', e);
  }
}

async function main() {
  console.log('🚀 Starting SobaNexus God-Mode Logic Simulation...\n');
  
  await runTest('Soba sat'); // Should be Action Path
  await runTest('Ahmet Bey\'e 2 adet soba sat ve stoktan düş'); // Should be Action Chain/Smart
  await runTest('Satışlar sayfasına git'); // Should be Navigation
  await runTest('Bu ay satışlar nasıl?'); // Should be Fast Path (Analysis)
  
  console.log('\n✅ Simulation Complete.');
}

main();
