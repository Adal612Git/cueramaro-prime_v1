import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name!: string;

  @IsString()
  taxId!: string;

  @IsString()
  bank!: string;

  @IsString()
  account!: string;

  @IsNumber()
  credit!: number;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsNumber()
  credit?: number;
}
