/**
 * Script to generate Ethereal email test account credentials
 * Ethereal is a fake SMTP service perfect for testing email functionality
 * 
 * Usage: node scripts/setup-ethereal.js
 * 
 * This will generate credentials that you can add to your .env file
 */

import nodemailer from 'nodemailer';

async function createEtherealAccount() {
  try {
    console.log('🔧 Creating Ethereal test account...\n');
    
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Ethereal account created successfully!\n');
    console.log('📧 Add these credentials to your .env file:\n');
    console.log('='.repeat(60));
    console.log('SMTP_HOST=smtp.ethereal.email');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASSWORD=${testAccount.pass}`);
    console.log('EMAIL_FROM=noreply@eventknit.com');
    console.log('='.repeat(60));
    console.log('\n📬 View your test emails at: https://ethereal.email');
    console.log(`   Login with: ${testAccount.user}`);
    console.log(`   Password: ${testAccount.pass}\n`);
    console.log('💡 Note: These credentials are valid for testing only.');
    console.log('   Emails sent will appear in your Ethereal inbox, not real inboxes.\n');
    
  } catch (error) {
    console.error('❌ Error creating Ethereal account:', error.message);
    process.exit(1);
  }
}

createEtherealAccount();

