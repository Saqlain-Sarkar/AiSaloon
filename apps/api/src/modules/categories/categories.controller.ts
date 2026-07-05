import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CurrentUser } from '../../common/decorators';
import { JwtPayload } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService, private readonly prisma: PrismaService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.categoriesService.create(bizId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories for a business' })
  async findAll(@CurrentUser() user: JwtPayload) {
    const bizId = user?.businessId;
    if (!bizId) {
      throw new UnauthorizedException('No business associated with this user');
    }
    return this.categoriesService.findAll(bizId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a category' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
