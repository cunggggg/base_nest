import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { UserEntity } from '@admin/access/users/user.entity';
import { DashboardService } from '@admin/dashboard/dashboard.service';
import { DashboardSummaryDto } from '@admin/dashboard/dto/dashboard-summary.dto';

@ApiTags('Admin')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/summary')
  async summary(@CurrentUser() user: UserEntity): Promise<DashboardSummaryDto> {
    if (!user.isSuperUser) {
      throw new ForbiddenException();
    }

    return await this.dashboardService.summary();
  }
}
