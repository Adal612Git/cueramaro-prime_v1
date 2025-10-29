import { Module } from '@nestjs/common';
import { CxcController } from './cxc.controller';
import { CxcService } from './cxc.service';

@Module({
  controllers: [CxcController],
  providers: [CxcService],
  exports: [CxcService]
})
export class CxcModule {}
