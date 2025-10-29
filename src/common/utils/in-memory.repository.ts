// Repositorio en memoria para facilitar pruebas sin base de datos real.
export class InMemoryRepository<T extends { id: string }> {
  private readonly items = new Map<string, T>();

  all(): T[] {
    return Array.from(this.items.values());
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  create(entity: T): T {
    this.items.set(entity.id, entity);
    return entity;
  }

  update(id: string, entity: Partial<T>): T | undefined {
    const current = this.items.get(id);
    if (!current) {
      return undefined;
    }
    const next = { ...current, ...entity } as T;
    this.items.set(id, next);
    return next;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }
}
