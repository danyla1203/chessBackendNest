import { parseArgs } from 'node:util';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const options: { env: { type: 'string' | 'boolean' } } = {
  env: { type: 'string' },
};

async function generateData() {
  for (let i = 1; i < 11; i++) {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        name: faker.internet.userName(),
        password: faker.internet.password(),
        confirmation: {
          create: {
            email,
            code: faker.string.nanoid(8),
            isConfirmed: true,
          },
        },
      },
    });

    if (i % 2 == 0) {
      await prisma.auth.createMany({
        data: [
          {
            refreshToken: faker.string.uuid(),
            deviceId: faker.string.nanoid(8),
            userId: user.id,
          },
          {
            refreshToken: faker.string.uuid(),
            deviceId: faker.string.nanoid(8),
            userId: user.id,
          },
        ],
      });
      await prisma.game.create({
        data: {
          maxTime: faker.number.int({ min: 3600, max: 360000 }),
          timeIncrement: faker.number.int({ min: 3600, max: 360000 }),
          sideSelecting: faker.string.fromCharacters('wb'),
          isDraw: false,
          moves: '',
          players: {
            create: [
              {
                side: 'w',
                isWinner: true,
                userId: user.id,
              },
              {
                side: 'b',
                isWinner: false,
                userId: user.id - 1,
              },
            ],
          },
        },
      });
      await prisma.confirmation.create({
        data: {
          email: faker.internet.email(),
          code: faker.string.nanoid(8),
          isConfirmed: true,
        },
      });
      await prisma.confirmation.create({
        data: {
          email: faker.internet.email(),
          code: faker.string.nanoid(8),
          isConfirmed: false,
        },
      });
    }
  }
}

async function main() {
  const {
    values: { env },
  } = parseArgs({ options });
  console.log(`Seeding... with env ${env}`);
  switch (env) {
    case 'test':
      await generateData();
      break;
    default:
      break;
  }
}
main();
