import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ResolveReportDto } from './dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles('admin')
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get()
  list() {
    return this.reports.list();
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.reports.resolve(id, dto);
  }
}
