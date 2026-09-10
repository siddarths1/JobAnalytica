import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getPreferences(@CurrentUser() user: any) {
    return this.preferencesService.getUserPreferences(user.id);
  }

  @Put()
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.preferencesService.updateUserPreferences(user.id, dto);
  }
}
