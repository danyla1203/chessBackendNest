import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, INestApplication } from '@nestjs/common';
import * as req from 'supertest';
import { AppModule } from '../../app.module';
import { faker } from '@faker-js/faker';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { checkTokens } from '../../../test/utils/checkTokens';
import { JwtService } from '@nestjs/jwt';

jest.mock('axios', () => null);

describe('User e2e', () => {
  let app: INestApplication;
  let server: any;
  let prisma: PrismaService;
  let cnf: ConfigService;
  let jwt: JwtService;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    prisma = moduleFixture.get(PrismaService);
    cnf = moduleFixture.get(ConfigService);
    jwt = moduleFixture.get(JwtService);
  });
  afterAll(async () => {
    await app.close();
    server.close();
  });

  describe('signup', () => {
    it('should return 409 if no email confirmation', (done) => {
      req(server)
        .post('/user/signup')
        .send({
          name: faker.internet.userName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          deviceId: 'test1',
        })
        .expect(409, new ConflictException('Confirm email first').getResponse())
        .end(done);
    });
    it('should return 409 if user already exist', async () => {
      const user = await prisma.user.findFirst();
      await req(server)
        .post('/user/signup')
        .send({
          name: faker.internet.userName(),
          email: user.email,
          password: faker.internet.password(),
          deviceId: 'test1',
        })
        .expect(
          409,
          new ConflictException('User already exists').getResponse(),
        );
    });
    it('should create user and return tokens', async () => {
      const confirmation = await prisma.confirmation.findFirst({
        include: {
          user: true,
        },
        where: {
          user: null,
        },
      });
      const { body } = await req(server)
        .post('/user/signup')
        .send({
          name: faker.internet.userName(),
          email: confirmation.email,
          password: faker.internet.password(),
          deviceId: 'test1',
        })
        .expect(201);
      expect(body).toHaveProperty('access');
      expect(body).toHaveProperty('refresh');

      const [access, refresh] = checkTokens(
        body.access,
        body.refresh,
        cnf.get('JWT_SECRET'),
      );
      const user = await prisma.user.findUnique({
        where: { email: confirmation.email },
      });
      const expectedPayload = { id: user.id, deviceId: 'testD' };

      expect(access.id).toEqual(expectedPayload.id);
      expect(refresh.id).toEqual(expectedPayload.id);
      expect(refresh.deviceId).toEqual('test1');
      expect(access.deviceId).toEqual('test1');
    });
  });
  describe('getProfile', () => {
    let access: string;
    let user: any;
    beforeAll(async () => {
      user = await prisma.user.findFirst({
        include: {
          auth: true,
        },
        where: {
          auth: { some: {} },
        },
      });
      access = jwt.sign(
        { id: user.id, deviceId: user.auth[0].deviceId },
        {
          secret: cnf.get('JWT_SECRET'),
        },
      );
    });
    it('should return profile', async () => {
      await req(server)
        .get('/user')
        .set('Authorization', `Bearer ${access}`)
        .expect(200, { id: user.id, name: user.name, email: user.email });
    });
  });
  describe('get games', () => {
    let access: string;
    let games: any;
    beforeAll(async () => {
      const user = await prisma.user.findFirst({
        include: {
          auth: true,
          players: {
            include: {
              game: true,
            },
          },
        },
        where: {
          auth: { some: {} },
          players: { some: {} },
        },
      });
      games = await prisma.game.findMany({
        select: {
          id: true,
          maxTime: true,
          timeIncrement: true,
          sideSelecting: true,
          isDraw: true,
          moves: true,
          players: {
            select: {
              userId: true,
              side: true,
              isWinner: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
        where: { players: { some: { userId: user.id } } },
        orderBy: { id: 'asc' },
      });
      access = jwt.sign(
        { id: user.id, deviceId: user.auth[0].deviceId },
        {
          secret: cnf.get('JWT_SECRET'),
        },
      );
    });
    it('should return user games', async () => {
      const parsed = games.map((g) => {
        const time = Math.floor(g.maxTime / (1000 * 60));
        const inc = Math.floor(g.timeIncrement / 1000);
        const [pl1, pl2] = g.players.map((pl) => {
          return {
            userId: pl.userId,
            side: pl.side,
            winner: pl.isWinner,
            name: pl.user.name,
          };
        });
        const result = g.isDraw
          ? { pl1, pl2 }
          : pl1.winner
          ? { winner: pl1, looser: pl2 }
          : { winner: pl2, looser: pl1 };
        return {
          id: g.id,
          key: g.id,
          cnf: {
            inc,
            time,
          },
          result,
          sidepick: g.sideSelecting,
        };
      });
      await req(server)
        .get('/user/games')
        .set('Authorization', `Bearer ${access}`)
        .expect(200, { games: parsed, wins: 0, looses: 1, draws: 0 });
    });
  });
  describe('update', () => {
    let access: string;
    let user: any;
    beforeAll(async () => {
      user = await prisma.user.findFirst({
        include: {
          auth: true,
        },
        where: {
          auth: { some: {} },
        },
      });
      access = jwt.sign(
        { id: user.id, deviceId: user.auth[0].deviceId },
        {
          secret: cnf.get('JWT_SECRET'),
        },
      );
    });
    it('should update user', async () => {
      await req(server)
        .patch('/user')
        .set('Authorization', `Bearer ${access}`)
        .send({
          name: 'NewName',
        })
        .expect(200, { id: user.id, name: 'NewName', email: user.email });
    });
  });
});
