import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum CustomerType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale'
}

export class CreateCustomerDto {
  @IsString()
  name!: string;

  @IsEnum(CustomerType)
  kind!: CustomerType;

  @IsNumber()
  creditLimit!: number;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  kind?: CustomerType;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;
}

export { CustomerType };
