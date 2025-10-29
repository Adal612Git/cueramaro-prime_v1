import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateCustomerDto, CustomerType, UpdateCustomerDto } from './dto/create-customer.dto';

export interface CustomerEntity {
  id: string;
  name: string;
  kind: CustomerType;
  creditLimit: number;
}

@Injectable()
export class CustomersService {
  private readonly repository = new InMemoryRepository<CustomerEntity>();

  create(payload: CreateCustomerDto): CustomerEntity {
    const entity: CustomerEntity = { id: randomUUID(), ...payload };
    return this.repository.create(entity);
  }

  findAll(): CustomerEntity[] {
    return this.repository.all();
  }

  findOne(id: string): CustomerEntity | undefined {
    return this.repository.get(id);
  }

  update(id: string, payload: UpdateCustomerDto): CustomerEntity | undefined {
    return this.repository.update(id, payload);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
