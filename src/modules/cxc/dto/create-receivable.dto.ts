import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReceivableDto {
  @IsString()
  saleId!: string;

  @IsNumber()
  balance!: number;

  @IsDateString()
  dueDate!: string;
}

export class RegisterReceivablePaymentDto {
  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
