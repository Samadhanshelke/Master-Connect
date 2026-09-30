import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetRoleDto, ToggleFlagDto, UpdateMeDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Get('me/social')
  social(@CurrentUser() user: { id: string }) {
    return this.users.social(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Post('me/follows/:userId')
  follow(
    @CurrentUser() user: { id: string },
    @Param('userId') userId: string,
    @Body() dto: ToggleFlagDto,
  ) {
    return this.users.setFollow(user.id, userId, dto.active);
  }

  @Post('me/bookmarks/:postId')
  bookmark(
    @CurrentUser() user: { id: string },
    @Param('postId') postId: string,
    @Body() dto: ToggleFlagDto,
  ) {
    return this.users.setBookmark(user.id, postId, dto.active);
  }

  @Roles('admin')
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.users.setRole(id, dto);
  }
}
