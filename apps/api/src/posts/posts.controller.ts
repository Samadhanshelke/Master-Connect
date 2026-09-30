import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CommentDto, CreatePostDto, ReportPostDto } from './dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private posts: PostsService) {}

  @Get()
  list(@Query('city') city?: string, @Query('authorId') authorId?: string) {
    return this.posts.list(city, authorId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.posts.get(id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.posts.remove(user, id);
  }

  @Post(':id/like')
  like(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.posts.toggleLike(user, id);
  }

  @Post(':id/comments')
  comment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CommentDto,
  ) {
    return this.posts.comment(user, id, dto);
  }

  @Post(':id/report')
  report(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.posts.report(user, id, dto);
  }
}
