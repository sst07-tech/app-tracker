import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module';
import { DynamoModule } from './aws/dynamo.module';

@Module({
  imports: [DynamoModule, ApplicationsModule],
})
export class AppModule {}
