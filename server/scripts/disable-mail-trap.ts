import { prisma } from '../src/config/database.js';

/**
 * Disable mail trap for production use
 * Run this on production database to ensure real users receive emails
 */
async function disableMailTrap() {
  try {
    const config = await prisma.configuration.findFirst();
    
    if (!config) {
      console.log('❌ No configuration found in database. Creating default with trap disabled...');
      await prisma.configuration.create({
        data: {
          mailTrap: {
            trap: false, // Disabled for production
            toAddress: [],
            ccAddress: []
          },
          isSystemUnderMaintenance: false
        }
      });
      console.log('✅ Configuration created with mail trap DISABLED (production mode)');
    } else {
      const currentTrap = config.mailTrap as any;
      console.log('\nCurrent mailTrap status:', currentTrap?.trap ? '🟡 ENABLED (test mode)' : '🟢 DISABLED (production mode)');
      
      if (currentTrap?.trap === true) {
        await prisma.configuration.update({
          where: { id: config.id },
          data: {
            mailTrap: {
              trap: false,
              toAddress: [],
              ccAddress: []
            }
          }
        });
        console.log('✅ Mail trap DISABLED! Real users will now receive emails.');
      } else {
        console.log('✅ Mail trap is already disabled. No changes needed.');
      }
    }
    
    const updated = await prisma.configuration.findFirst();
    console.log('\nFinal mailTrap configuration:');
    console.log(JSON.stringify(updated?.mailTrap, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

disableMailTrap();
