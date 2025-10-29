import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateUserDto, UpdateUserDto, UserRole } from './dto/create-user.dto';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  private readonly repository = new InMemoryRepository<UserEntity>();

  constructor() {
    // Usuario inicial para acceder al sistema sin configuración previa.
    const id = randomUUID();
    const password = bcrypt.hashSync('changeme', 10);
    this.repository.create({
      id,
      name: 'Administrador',
      email: 'admin@cueramaro.local',
      password,
      role: UserRole.ADMIN
    });
  }

  create(payload: CreateUserDto): UserEntity {
    const entity: UserEntity = {
      id: randomUUID(),
      name: payload.name,
      email: payload.email,
      password: bcrypt.hashSync(payload.password, 10),
      role: payload.role
    };
    return this.repository.create(entity);
  }

  findAll(): UserEntity[] {
    return this.repository.all();
  }

  findOne(id: string): UserEntity | undefined {
    return this.repository.get(id);
  }

  update(id: string, payload: UpdateUserDto): UserEntity | undefined {
    const data: Partial<UserEntity> = { ...payload };
    if (payload.password) {
      data.password = bcrypt.hashSync(payload.password, 10);
    }
    return this.repository.update(id, data);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
