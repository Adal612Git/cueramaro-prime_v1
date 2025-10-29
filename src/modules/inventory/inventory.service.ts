import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateLotDto, LotStatus, UpdateLotDto } from './dto/create-lot.dto';

export interface LotEntity {
  id: string;
  productId: string;
  supplierId: string;
  weight: number;
  entryDate: string;
  status: LotStatus;
}

@Injectable()
export class InventoryService {
  private readonly repository = new InMemoryRepository<LotEntity>();

  create(payload: CreateLotDto): LotEntity {
    const entity: LotEntity = { id: randomUUID(), ...payload };
    return this.repository.create(entity);
  }

  findAll(): LotEntity[] {
    return this.repository.all();
  }

  update(id: string, payload: UpdateLotDto): LotEntity | undefined {
    return this.repository.update(id, payload);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
