import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { CreateNotificationDto } from './dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateNotificationDto) {
    return this.notifications.create(user, dto);
  }

  @Post('welcome')
  welcome(@CurrentUser() user: RequestUser) {
    return this.notifications.welcome(user);
  }

  @Patch('read-all')
  markAll(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.remove(user.id, id);
  }
}
