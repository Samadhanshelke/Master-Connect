import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const error =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body && 'error' in body
            ? String((body as { error: string }).error)
            : typeof body === 'object' && body && 'message' in body
              ? Array.isArray((body as { message: string[] }).message)
                ? (body as { message: string[] }).message.join(', ')
                : String((body as { message: string }).message)
              : 'Request failed';
      response.status(status).json({ error });
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}
