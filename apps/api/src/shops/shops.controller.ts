import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@Controller('shops')
export class ShopsController {
  constructor(private shops: ShopsService) {}

  @Get()
  list(@Query('city') city?: string) {
    return this.shops.list(city);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.shops.get(id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateShopDto) {
    return this.shops.create(user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.shops.remove(user, id);
  }
}
