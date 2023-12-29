import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import * as req from 'supertest';
import { AuthService } from '../auth.service';
import { faker } from '@faker-js/faker';
import { PrismaService } from '../../prisma.service';

jest.mock('axios', () => null);

describe('AuthController unit', () => {
  let service: AuthService;
  let app: INestApplication;
  let server: any;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue({
        login: jest.fn(),
        useRefresh: jest.fn(),
        sendVerificationMail: jest.fn(),
        verifyEmail: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    service = module.get(AuthService);
    await app.init();
    server = app.getHttpServer();
  });

  describe('login with incorrect data', () => {
    const cases = [
      {},
      { password: 'correctPass', deviceId: 'correctId' },
      { email: 'correct.email@gmail.com', deviceId: 'correctId' },
      { email: 'correct.email@gmail.com', password: 'correctPass' },
      { email: 'correct.email@gmail.com', password: 'correctPass' },
      { email: 'correct.email@gmail.com' },
      { password: 'correctPass' },
      { deviceId: 'correctId' },
      { email: 'fakeemail', password: 'correctPass', deviceId: 'correctId' },
      { email: '', password: 'correctPass', deviceId: 'correctId' },
      { email: '@gmail.com', password: 'correctPass', deviceId: 'correctId' },
      { email: 11234, password: 'correctPass', deviceId: 'correctId' },
      {
        email: 'correct.email@gmail.com',
        password: 'short',
        deviceId: 'correctId',
      },
      {
        email: 'correct.email@gmail.com',
        password: '',
        deviceId: 'correctId',
      },
      {
        email: 'correct.email@gmail.com',
        password: 1234,
        deviceId: 'correctId',
      },
      {
        email: 'correct.email@gmail.com',
        password: 'tooLongPassword12345677',
        deviceId: 'correctId',
      },
      {
        email: 'correct.email@gmail.com',
        password: 'correctPassword',
        deviceId: '',
      },
      {
        email: 'correct.email@gmail.com',
        password: 'correctPassword',
        deviceId: 1234,
      },
    ];
    test.each(cases)('for data - %p should throw bad request', (data) => {
      return req(server).post('/auth/login').send(data).expect(400);
    });
  });
  describe('login with correct data', () => {
    const cases = [...Array(10).keys()];
    test.each(cases)(
      'for correct login data should call service methods',
      async () => {
        await req(server)
          .post('/auth/login')
          .send({
            email: faker.internet.email(),
            password: faker.internet.password(),
            deviceId: faker.string.nanoid(7),
          });
        expect(service.login).toBeCalled();
      },
    );
  });
  describe('use refresh with incorrect data', () => {
    const cases = [
      {},
      { refreshToken: null },
      { refreshToken: '' },
      { refreshToken: 1234 },
    ];
    test.each(cases)('for data - %p should throw bad request', (data) => {
      return req(server).post('/auth/login').send(data).expect(400);
    });
  });
  describe('use refresh with correct data', () => {
    const cases = [...Array(10).keys()];
    test.each(cases)('for data - %p should throw bad request', async () => {
      await req(server).put('/auth/use-refresh').send({
        refreshToken: faker.string.uuid(),
      });
      expect(service.useRefresh).toBeCalled();
    });
  });
  describe('send verification mail with inccorect data', () => {
    const cases = [
      {},
      { email: null },
      { email: '' },
      { email: 1234 },
      { email: 'noemail' },
      { email: 'gmail.com' },
      { email: '@gmail.com' },
    ];
    test.each(cases)('for data - %p should throw bad request', (data) => {
      return req(server)
        .post('/auth/send-verification-mail')
        .send(data)
        .expect(400);
    });
  });
  describe('send verification mail with correct data', () => {
    const cases = [...Array(10).keys()];
    test.each(cases)('for data - %p should throw bad request', async () => {
      await req(server).post('/auth/send-verification-mail').send({
        email: faker.internet.email(),
      });
      expect(service.sendVerificationMail).toBeCalled();
    });
  });
  describe('verify email with incorrect data', () => {
    const cases = [
      {},
      { email: null, code: 'okCode' },
      { email: '', code: 'okCode' },
      { email: 1234, code: 'okCode' },
      { email: 'noemail', code: 'okCode' },
      { email: 'gmail.com', code: 'okCode' },
      { email: '@gmail.com', code: 'okCode' },
      { email: '@gmail.com', code: null },
      { email: '@gmail.com', code: '' },
      { email: 'correct.email@gmail.com', code: '' },
      { email: 'correct.email@gmail.com', code: null },
    ];
    test.each(cases)('for data - %p should throw bad request', (data) => {
      return req(server).patch('/auth/verify-email').send(data).expect(400);
    });
  });
  describe('verify email with correct code', () => {
    const cases = [...Array(10).keys()];
    test.each(cases)('for data - %p should throw bad request', async () => {
      await req(server)
        .patch('/auth/verify-email')
        .send({
          email: faker.internet.email(),
          code: faker.string.nanoid(7),
        });
      expect(service.verifyEmail).toBeCalled();
    });
  });
});
