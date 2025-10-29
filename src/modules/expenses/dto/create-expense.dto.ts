import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  concept!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  concept?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
