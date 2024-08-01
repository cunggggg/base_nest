import { Module } from '@nestjs/common';
import { FireBaseModule } from './fire-base/fire-base.module';
import { MuxService } from '@modules/integration/mux/mux.service';

@Module({
  imports: [FireBaseModule],
  providers: [MuxService],
  exports: [MuxService],
})
export class IntegrationModule {}
