import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, VotePollDto } from './dto';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('rooms')
  rooms() {
    return this.chat.rooms();
  }

  @Get('rooms/mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.chat.myRooms(user.id);
  }

  @Get('rooms/:id/messages')
  messages(@Param('id') id: string) {
    return this.chat.messages(id);
  }

  @Get('rooms/:id/members')
  members(@Param('id') id: string) {
    return this.chat.members(id);
  }

  @Post('rooms/:id/join')
  join(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chat.join(user, id);
  }

  @Post('rooms/:id/messages')
  send(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.send(user, id, dto);
  }

  @Delete('rooms/:id/messages/:messageId')
  deleteMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chat.deleteMessage(user, id, messageId);
  }

  @Post('rooms/:id/messages/:messageId/vote')
  vote(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() dto: VotePollDto,
  ) {
    return this.chat.vote(user, id, messageId, dto.optionIndex);
  }

  @Post('rooms/:id/messages/:messageId/report')
  report(@CurrentUser() user: RequestUser, @Param('messageId') messageId: string) {
    return this.chat.reportMessage(user, messageId);
  }
}
