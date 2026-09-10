import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdatePreferenceDto } from './dto/preference.dto';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  getPreferences(@CurrentUser('id') userId: string) {
    return this.preferencesService.getUserPreferences(userId);
  }

  @Patch()
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.preferencesService.updateUserPreferences(userId, dto);
  }
}
