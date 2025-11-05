import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]+/g, '_');
}

@Controller('uploads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UploadsController {
  @Post('expenses')
  @Roles('ADMIN', 'MOSTRADOR')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    })
  )
  async uploadExpense(@UploadedFile() file?: any): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Archivo inválido');
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowed.includes(ext)) throw new BadRequestException('Tipo de archivo no permitido');
    if (file.mimetype && !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('MIME inválido');
    }
    const base = path.basename(file.originalname || 'archivo', ext);
    const stamp = Date.now();
    const safe = `${sanitizeFileName(base)}-${stamp}${ext}`;
    const dir = path.join(process.cwd(), 'uploads', 'expenses');
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    const dest = path.join(dir, safe);
    try {
      if (file.buffer && file.buffer.length) {
        fs.writeFileSync(dest, file.buffer);
      } else if (file.path && fs.existsSync(file.path)) {
        fs.copyFileSync(file.path, dest);
        try { fs.unlinkSync(file.path); } catch {}
      } else {
        throw new Error('No buffer');
      }
    } catch {
      throw new BadRequestException('No se pudo guardar el archivo');
    }
    const rel = `/uploads/expenses/${safe}`;
    return { url: rel };
  }
}
