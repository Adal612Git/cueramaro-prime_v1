import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InMemoryRepository } from '../../common/utils/in-memory.repository';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

export interface ProductEntity {
  id: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  lotId: string;
}

@Injectable()
export class ProductsService {
  private readonly repository = new InMemoryRepository<ProductEntity>();

  create(payload: CreateProductDto): ProductEntity {
    const entity: ProductEntity = { id: randomUUID(), ...payload };
    return this.repository.create(entity);
  }

  findAll(): ProductEntity[] {
    return this.repository.all();
  }

  findOne(id: string): ProductEntity | undefined {
    return this.repository.get(id);
  }

  update(id: string, payload: UpdateProductDto): ProductEntity | undefined {
    return this.repository.update(id, payload);
  }

  remove(id: string): boolean {
    return this.repository.delete(id);
  }
}
