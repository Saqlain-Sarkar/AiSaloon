import { Test, TestingModule } from '@nestjs/testing';
import { BusinessService } from './business.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';

describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: PrismaService;

  const mockPrismaService = {
    business: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateBusinessDto = {
      name: 'Test Business',
      slug: 'test-business',
    };

    it('should create a new business', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);
      const expectedResult = { id: '1', ...createDto };
      mockPrismaService.business.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(prisma.business.findUnique).toHaveBeenCalledWith({ where: { slug: createDto.slug } });
      expect(prisma.business.create).toHaveBeenCalledWith({ data: createDto });
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue({ id: '2', slug: createDto.slug });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({ where: { slug: createDto.slug } });
      expect(prisma.business.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of businesses', async () => {
      const expectedResult = [{ id: '1', name: 'Test', deletedAt: null }];
      mockPrismaService.business.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(prisma.business.findMany).toHaveBeenCalledWith({ where: { deletedAt: null } });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a business if found', async () => {
      const expectedResult = { id: '1', name: 'Test', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(expectedResult);

      const result = await service.findOne('1');

      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { branches: true },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if business is deleted', async () => {
      mockPrismaService.business.findUnique.mockResolvedValue({ id: '1', deletedAt: new Date() });

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Name', slug: 'updated-slug' };

    it('should update a business successfully', async () => {
      const existingBusiness = { id: '1', name: 'Old Name', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(existingBusiness);
      mockPrismaService.business.findFirst.mockResolvedValue(null);
      const expectedResult = { ...existingBusiness, ...updateDto };
      mockPrismaService.business.update.mockResolvedValue(expectedResult);

      const result = await service.update('1', updateDto);

      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { branches: true },
      });
      expect(prisma.business.findFirst).toHaveBeenCalledWith({
        where: { slug: updateDto.slug, id: { not: '1' } },
      });
      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException if new slug is taken', async () => {
      const existingBusiness = { id: '1', name: 'Old Name', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(existingBusiness);
      mockPrismaService.business.findFirst.mockResolvedValue({ id: '2', slug: updateDto.slug });

      await expect(service.update('1', updateDto)).rejects.toThrow(ConflictException);
      expect(prisma.business.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a business', async () => {
      const existingBusiness = { id: '1', name: 'Test', deletedAt: null };
      mockPrismaService.business.findUnique.mockResolvedValue(existingBusiness);
      mockPrismaService.business.update.mockResolvedValue({ ...existingBusiness, deletedAt: new Date() });

      const result = await service.remove('1');

      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { branches: true },
      });
      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Business deleted successfully' });
    });
  });
});
