import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentEngine } from '../src/modules/appointments/appointment-engine.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppointmentEngine', () => {
  let engine: AppointmentEngine;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentEngine, PrismaService],
    }).compile();

    engine = module.get<AppointmentEngine>(AppointmentEngine);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('validateSlot', () => {
    it('should reject slots outside working hours', async () => {
      const result = await engine.validateSlot(
        'test-business',
        'test-branch',
        new Date('2026-07-01T22:00:00Z'),
        new Date('2026-07-01T23:00:00Z'),
      );
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Outside working hours');
    });
  });
});
