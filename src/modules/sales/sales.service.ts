import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateSaleDto, RegisterPaymentDto, SaleItemDto } from './dto/create-sale.dto';

export interface SaleEntity {
  id: string;
  customerId: string;
  total: number;
  paid: number;
  items: SaleItemDto[];
  notes?: string;
  createdAt: string;
}

@Injectable()
export class SalesService {
  private readonly repository = new InMemoryRepository<SaleEntity>();

  create(payload: CreateSaleDto): SaleEntity {
    const entity: SaleEntity = {
      id: randomUUID(),
      customerId: payload.customerId,
      total: payload.total,
      paid: 0,
      items: payload.items,
      notes: payload.notes,
      createdAt: new Date().toISOString()
    };
    return this.repository.create(entity);
  }

  registerPayment(id: string, payload: RegisterPaymentDto): SaleEntity | undefined {
    const sale = this.repository.get(id);
    if (!sale) {
      return undefined;
    }
    return this.repository.update(id, { paid: sale.paid + payload.amount });
  }

  findAll(): SaleEntity[] {
    return this.repository.all();
  }
}
