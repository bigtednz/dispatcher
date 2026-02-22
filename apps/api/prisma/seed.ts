/**
 * Prisma seed: Waikato stations/resources + default rules.
 * Run with: pnpm --filter api exec prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { WAIKATO_STATIONS, RESOURCES_BY_STATION } from './waikato-seed.data';

const prisma = new PrismaClient();

async function main() {
  const existingStation = await prisma.station.findFirst({ where: { name: 'Morrinsville' } });
  if (!existingStation) {
    for (const s of WAIKATO_STATIONS) {
      const station = await prisma.station.create({
        data: { name: s.name, lat: s.lat, lng: s.lng, address: s.address },
      });
      const resources = RESOURCES_BY_STATION[s.name] ?? [];
      for (const r of resources) {
        await prisma.resource.create({
          data: { stationId: station.id, callSign: r.callSign, capabilities: r.capabilities },
        });
      }
    }
    console.log('Waikato seed applied');
  }

  const existingRules = await prisma.ruleSet.findFirst({ where: { name: 'default-v1' } });
  if (!existingRules) {
    await prisma.ruleSet.updateMany({ data: { isActive: false } });
    await prisma.ruleSet.create({
      data: {
        name: 'default-v1',
        version: 1,
        isActive: true,
        description: 'Default capability-based dispatch rules',
        rules: {
          create: [
            { name: 'house-fire-priority-1-2', priority: 100, when: { type: 'HOUSE_FIRE', priority: [1, 2] }, recommend: { requiredCapabilities: ['PUMP', 'RESCUE', 'COMMAND'], minimumCounts: { PUMP: 2, RESCUE: 1, COMMAND: 1 }, maxTravelMinutes: 15 } },
            { name: 'house-fire-default', priority: 50, when: { type: 'HOUSE_FIRE' }, recommend: { requiredCapabilities: ['PUMP', 'RESCUE'], minimumCounts: { PUMP: 1, RESCUE: 1 }, maxTravelMinutes: 20 } },
            { name: 'vehicle-crash', priority: 60, when: { type: 'VEHICLE_CRASH' }, recommend: { requiredCapabilities: ['RESCUE', 'PUMP', 'MEDICAL_SUPPORT'], minimumCounts: { RESCUE: 1, PUMP: 1 }, maxTravelMinutes: 15 } },
            { name: 'vegetation-fire', priority: 55, when: { type: 'VEGETATION_FIRE' }, recommend: { requiredCapabilities: ['PUMP', 'WATER_SUPPLY_SUPPORT'], minimumCounts: { PUMP: 2 }, maxTravelMinutes: 25 } },
            { name: 'hazmat-suspected', priority: 90, when: { type: 'HAZMAT_SUSPECTED' }, recommend: { requiredCapabilities: ['HAZMAT_SUPPORT', 'COMMAND', 'PUMP'], minimumCounts: { HAZMAT_SUPPORT: 1, COMMAND: 1 }, maxTravelMinutes: 20 } },
            { name: 'alarm-activation', priority: 30, when: { type: 'ALARM_ACTIVATION' }, recommend: { requiredCapabilities: ['PUMP'], minimumCounts: { PUMP: 1 }, maxTravelMinutes: 10 } },
            { name: 'medical-assist', priority: 70, when: { type: 'MEDICAL_ASSIST' }, recommend: { requiredCapabilities: ['MEDICAL_SUPPORT', 'RESCUE'], minimumCounts: { MEDICAL_SUPPORT: 1 }, maxTravelMinutes: 12 } },
            { name: 'fallback', priority: 1, when: {}, recommend: { requiredCapabilities: ['PUMP'], minimumCounts: { PUMP: 1 }, maxTravelMinutes: 25 } },
          ],
        },
      },
    });
    console.log('Default rules seeded');
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@dispatcher.local' } });
  if (!admin) {
    const hash = await argon2.hash('admin1234');
    await prisma.user.create({
      data: { email: 'admin@dispatcher.local', passwordHash: hash, name: 'Admin', role: 'admin' },
    });
    console.log('Admin user created (admin@dispatcher.local / admin1234)');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
