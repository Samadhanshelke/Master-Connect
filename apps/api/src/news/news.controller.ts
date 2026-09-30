import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private news: NewsService) {}

  @Get()
  list(@Query('category') category?: string) {
    return this.news.list(category);
  }
}
