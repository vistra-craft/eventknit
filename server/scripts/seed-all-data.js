#!/usr/bin/env node

/**
 * Master script to populate the database with organizers and comprehensive events
 * 
 * This script will:
 * 1. Create 6 new organizers with email/password authentication
 * 2. Create 20+ diverse events with complete details (agenda, speakers, social links, etc.)
 * 
 * Usage: node scripts/seed-all-data.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runScript(scriptName, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  const scriptPath = path.join(__dirname, scriptName);
  
  try {
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: path.join(__dirname, '..'),
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`\n✅ ${description} completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ Error running ${description}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function main() {
  console.log('\n');
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║        EventKnit Database Population Script                ║');
  console.log('║                                                             ║');
  console.log('║  This will create:                                          ║');
  console.log('║  • 6 new organizers with email/password authentication      ║');
  console.log('║  • 20+ comprehensive events with full details               ║');
  console.log('║                                                             ║');
  console.log('║  All events will be in PENDING status (need admin approval) ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Step 1: Seed organizers
    await runScript('seed-organizers.js', 'Step 1: Creating Organizers');

    // Step 2: Seed comprehensive events
    await runScript('seed-comprehensive-events.js', 'Step 2: Creating Comprehensive Events');

    // Final summary
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║                    ✨ ALL DONE! ✨                          ║');
    console.log('╚═════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📊 Database has been populated with:');
    console.log('   • Multiple organizers (email/password authentication)');
    console.log('   • 20+ diverse events across various categories');
    console.log('   • Complete event details (agenda, speakers, social links)');
    console.log('   • Mix of free and paid events');
    console.log('   • Mix of in-person, online, and hybrid events');
    console.log('   • All events using Unsplash image URLs\n');
    console.log('🔐 Next Steps:');
    console.log('   1. Login as admin to approve events');
    console.log('   2. Events are in PENDING status and need approval');
    console.log('   3. Check the organizer credentials in the output above\n');
    console.log('📧 Existing Organizer:');
    console.log('   • scecil072@gmail.com (Continue with Email - existing)\n');
    console.log('📧 New Organizers (Password: SecurePass123!):');
    console.log('   • sarah.events@eventknit.com');
    console.log('   • mike.conferences@eventknit.com');
    console.log('   • priya.summits@eventknit.com');
    console.log('   • david.festivals@eventknit.com');
    console.log('   • emma.workshops@eventknit.com');
    console.log('   • james.corporate@eventknit.com\n');

  } catch (error) {
    console.error('\n❌ Failed to complete database population:', error.message);
    process.exit(1);
  }
}

main();
