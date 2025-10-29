import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum LotStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  DISCARDED = 'discarded'
}

export class CreateLotDto {
  @IsString()
  productId!: string;

  @IsString()
  supplierId!: string;

  @IsNumber()
  weight!: number;

  @IsDateString()
  entryDate!: string;

  @IsEnum(LotStatus)
  status!: LotStatus;
}

export class UpdateLotDto {
  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;
}

export { LotStatus };
