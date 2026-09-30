import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

mkdirSync('uploads', { recursive: true });

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (_req: unknown, file: { originalname?: string }, callback: (error: Error | null, filename: string) => void) => {
          const name = `${Date.now()}-${randomBytes(4).toString('hex')}${extname(file.originalname || '') || '.bin'}`;
          callback(null, name);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file?: { filename: string }) {
    if (!file) throw new BadRequestException({ error: 'file is required' });
    return { url: `/uploads/${file.filename}` };
  }
}
