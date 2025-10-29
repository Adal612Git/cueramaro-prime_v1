import { UsersService } from './users.service';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  it('should create a user with hashed password', () => {
    const service = new UsersService();
    const dto: CreateUserDto = {
      name: 'Tester',
      email: 'tester@example.com',
      password: 'password',
      role: UserRole.ADMIN
    };

    const result = service.create(dto);

    expect(result.id).toBeDefined();
    expect(service.findAll()).toHaveLength(2);
    expect(bcrypt.compareSync(dto.password, result.password)).toBe(true);
  });
});
