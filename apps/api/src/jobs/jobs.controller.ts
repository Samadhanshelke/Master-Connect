import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, SetJobStatusDto } from './dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  list(@Query('city') city?: string) {
    return this.jobs.list(city);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateJobDto) {
    return this.jobs.create(user, dto);
  }

  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetJobStatusDto,
  ) {
    return this.jobs.setStatus(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.jobs.remove(user, id);
  }
}
