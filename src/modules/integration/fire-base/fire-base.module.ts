import { forwardRef, Module } from '@nestjs/common';
import { FireBaseService } from './fire-base.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@admin/access/users/users.module';

@Module({
  imports: [ConfigModule, forwardRef(() => UsersModule)],
  providers: [FireBaseService],
  exports: [FireBaseService],
})
export class FireBaseModule {}
