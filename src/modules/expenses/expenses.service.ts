import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

export interface ExpenseEntity {
  id: string;
  concept: string;
  amount: number;
  attachmentUrl?: string;
  createdAt: string;
}

@Injectable()
export class ExpensesService {
  private readonly repository = new InMemoryRepository<ExpenseEntity>();

  create(payload: CreateExpenseDto): ExpenseEntity {
    const entity: ExpenseEntity = {
      id: randomUUID(),
      concept: payload.concept,
      amount: payload.amount,
      attachmentUrl: payload.attachmentUrl,
      createdAt: new Date().toISOString()
    };
    return this.repository.create(entity);
  }

  findAll(): ExpenseEntity[] {
    return this.repository.all();
  }

  update(id: string, payload: UpdateExpenseDto): ExpenseEntity | undefined {
    return this.repository.update(id, payload);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
