import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('cities')
export class CitiesController {
  constructor(private cities: CitiesService) {}

  @Public()
  @Get()
  list() {
    return this.cities.list();
  }

  @Roles('admin')
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCityDto) {
    return this.cities.create(user.id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cities.remove(id);
  }
}
