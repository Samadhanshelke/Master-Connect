import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BannersService } from './banners.service';
import { CreateBannerDto, SetBannerStatusDto } from './dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('banners')
export class BannersController {
  constructor(private banners: BannersService) {}

  @Get()
  list() {
    return this.banners.list();
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBannerDto) {
    return this.banners.create(user, dto);
  }

  @Post(':id/pay')
  pay(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.banners.pay(user, id);
  }

  @Roles('admin')
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: SetBannerStatusDto) {
    return this.banners.setStatus(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
