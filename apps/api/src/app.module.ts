import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './common/health/health.module';
import { LlmModule } from './common/llm/llm.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SourcesModule } from './modules/sources/sources.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { ExportsModule } from './modules/exports/exports.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    HealthModule,
    LlmModule,
    AuthModule,
    UsersModule,
    ResumesModule,
    PreferencesModule,
    JobsModule,
    SourcesModule,
    ApplicationsModule,
    ExportsModule,
    DiscoveryModule,
  ],
})
export class AppModule {}
