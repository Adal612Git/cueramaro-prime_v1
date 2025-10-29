import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';

export interface SupplierEntity {
  id: string;
  name: string;
  taxId: string;
  bank: string;
  account: string;
  credit: number;
}

@Injectable()
export class SuppliersService {
  private readonly repository = new InMemoryRepository<SupplierEntity>();

  create(payload: CreateSupplierDto): SupplierEntity {
    const entity: SupplierEntity = { id: randomUUID(), ...payload };
    return this.repository.create(entity);
  }

  findAll(): SupplierEntity[] {
    return this.repository.all();
  }

  findOne(id: string): SupplierEntity | undefined {
    return this.repository.get(id);
  }

  update(id: string, payload: UpdateSupplierDto): SupplierEntity | undefined {
    return this.repository.update(id, payload);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
