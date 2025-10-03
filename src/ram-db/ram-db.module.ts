import { Module } from '@nestjs/common';
import { RamDbService } from './ram-db.service';

@Module({
  providers: [RamDbService],
  exports: [RamDbService],
})
export class RamDbModule {}
