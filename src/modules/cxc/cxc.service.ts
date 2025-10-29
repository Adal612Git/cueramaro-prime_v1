import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateReceivableDto, RegisterReceivablePaymentDto } from './dto/create-receivable.dto';

export interface ReceivableEntity {
  id: string;
  saleId: string;
  balance: number;
  dueDate: string;
  paid: number;
  notes: string[];
}

@Injectable()
export class CxcService {
  private readonly repository = new InMemoryRepository<ReceivableEntity>();

  create(payload: CreateReceivableDto): ReceivableEntity {
    const entity: ReceivableEntity = {
      id: randomUUID(),
      saleId: payload.saleId,
      balance: payload.balance,
      dueDate: payload.dueDate,
      paid: 0,
      notes: []
    };
    return this.repository.create(entity);
  }

  registerPayment(id: string, payload: RegisterReceivablePaymentDto): ReceivableEntity | undefined {
    const receivable = this.repository.get(id);
    if (!receivable) {
      return undefined;
    }
    return this.repository.update(id, {
      paid: receivable.paid + payload.amount,
      notes: payload.note ? [...receivable.notes, payload.note] : receivable.notes
    });
  }

  findAll(): ReceivableEntity[] {
    return this.repository.all();
  }
}
