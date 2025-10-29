import { Injectable } from '@nestjs/common';

@Injectable()
export class SyncService {
  // Método ficticio que simula el estado de sincronización local-first.
  status() {
    return {
      status: 'idle',
      lastSync: null,
      electricUrl: process.env.ELECTRIC_URL
    };
  }
}
