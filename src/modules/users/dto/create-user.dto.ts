import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

enum UserRole {
  ADMIN = 'admin',
  COUNTER = 'mostrador'
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserDto {
  @IsString()
  name?: string;

  @IsEmail()
  email?: string;

  @MinLength(8)
  password?: string;

  @IsEnum(UserRole)
  role?: UserRole;
}

export { UserRole };
