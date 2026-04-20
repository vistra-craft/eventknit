import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function checkAgenda() {
  try {
    const events = await prisma.event.findMany({
      where: { agenda: { not: null } },
      select: { id: true, title: true, agenda: true },
      take: 3
    });
    
    if (events.length > 0) {
      console.log(`Found ${events.length} event(s) with agenda:\n`);
      
      events.forEach((event, index) => {
        console.log(`${index + 1}. Event: "${event.title}" (ID: ${event.id})`);
        console.log('   Agenda data:');
        
        if (Array.isArray(event.agenda)) {
          event.agenda.forEach((item, i) => {
            console.log(`   Item ${i + 1}:`);
            console.log(`     - Title: ${item.title || 'N/A'}`);
            console.log(`     - Description: ${item.description || 'MISSING'}`);
            console.log(`     - Start Time: ${item.startTime || 'N/A'}`);
            console.log(`     - End Time: ${item.endTime || 'N/A'}`);
          });
        } else {
          console.log('   Agenda is not an array:', typeof event.agenda);
        }
        console.log('');
      });
    } else {
      console.log('No events with agenda found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgenda();
