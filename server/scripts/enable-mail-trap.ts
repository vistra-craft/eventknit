import { prisma } from '../src/config/database.js';

async function enableMailTrap() {
  try {
    const config = await prisma.configuration.findFirst();
    
    if (!config) {
      console.log('❌ No configuration found in database. Creating default...');
      await prisma.configuration.create({
        data: {
          mailTrap: {
            trap: true,
            toAddress: ['vistracraft@gmail.com'],
            ccAddress: []
          },
          isSystemUnderMaintenance: false
        }
      });
      console.log('✅ Configuration created with mail trap enabled!');
    } else {
      await prisma.configuration.update({
        where: { id: config.id },
        data: {
          mailTrap: {
            trap: true,
            toAddress: ['vistracraft@gmail.com'],
            ccAddress: []
          }
        }
      });
      console.log('✅ Mail trap enabled! All emails will now be sent to vistracraft@gmail.com');
    }
    
    const updated = await prisma.configuration.findFirst();
    console.log('\nCurrent mailTrap configuration:');
    console.log(JSON.stringify(updated.mailTrap, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enableMailTrap();
