import { Module } from '@nestjs/common';
import { AccessModule } from './access/access.module';
import { DashboardModule } from '@admin/dashboard/dashboard.module';

@Module({
  imports: [AccessModule, DashboardModule],
})
export class AdminModule {}
