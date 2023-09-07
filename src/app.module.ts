import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MinuteSchema } from './schema/minute.schema';
import { MinuteTimeSeriesSchema } from './schema/minute-time-series';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017', {
      dbName: 'demo',
    }),
    MongooseModule.forFeature([
      { name: 'minutes', schema: MinuteSchema },
      { name: 'minutes_time_series', schema: MinuteTimeSeriesSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
