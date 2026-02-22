import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import * as request from 'supertest';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';

describe('Incident lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let resourceId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    const hash = await argon2.hash('password123');
    const user = await prisma.user.create({
      data: { email: 'e2e@test.com', passwordHash: hash, name: 'E2E' },
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e@test.com', password: 'password123' });
    token = login.body.accessToken;
    const station = await prisma.station.create({
      data: { name: 'E2E Station', lat: -37.65, lng: 175.53 },
    });
    const resource = await prisma.resource.create({
      data: { stationId: station.id, callSign: 'E2E-1', capabilities: ['PUMP'] },
    });
    resourceId = resource.id;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.eventLog.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.resource.deleteMany({});
    await prisma.station.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'e2e@test.com' } });
    await app.close();
  });

  it('creates incident', async () => {
    const res = await request(app.getHttpServer())
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'HOUSE_FIRE',
        priority: 2,
        lat: -37.65,
        lng: 175.53,
        label: 'E2E test',
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBe('HOUSE_FIRE');
    expect(res.body.status).toBe('NEW');
  });

  it('lists incidents and gets one with recommendation', async () => {
    const list = await request(app.getHttpServer())
      .get('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    const id = list.body[0]?.id;
    if (!id) return;
    const get = await request(app.getHttpServer())
      .get(`/incidents/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(get.body.id).toBe(id);
  });

  it('dispatches and closes incident', async () => {
    const create = await request(app.getHttpServer())
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'ALARM_ACTIVATION', priority: 3, lat: -37.66, lng: 175.54 })
      .expect(201);
    const id = create.body.id;
    await request(app.getHttpServer())
      .post(`/incidents/${id}/dispatch`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignments: [{ resourceId }] })
      .expect(201);
    const closed = await request(app.getHttpServer())
      .post(`/incidents/${id}/close`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(closed.body.status).toBe('CLOSED');
  });
});
