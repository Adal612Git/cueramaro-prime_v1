import { SyncService } from './sync.service';

describe('SyncService', () => {
  it('should expose status metadata', () => {
    const service = new SyncService();
    expect(service.status()).toMatchObject({ status: 'idle' });
  });
});
