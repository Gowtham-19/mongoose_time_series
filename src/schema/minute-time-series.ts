import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({
  timestamps: true,
  timeseries: {
    timeField: 'created_at',
    granularity: 'minutes',
    expiration: 0, // No automatic data removal
    compression: {
      type: 'zstd',
      level: 1,
    },
    default: 'daily', // Default aggregation interval (optional)
  },
})
export class MinutesTimeSeries {
  @Prop()
  sensor_id: number;
  @Prop()
  vx: number;
  @Prop()
  vy: number;
  @Prop()
  vz: number;
  @Prop({ type: Date, index: true })
  created_at: Date;
}
export const MinuteTimeSeriesSchema =
  SchemaFactory.createForClass(MinutesTimeSeries);
