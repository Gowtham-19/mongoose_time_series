import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema()
export class Minutes {
  @Prop()
  sensor_id: number;
  @Prop()
  vx: number;
  @Prop()
  vy: number;
  @Prop()
  vz: number;
  @Prop({ index: true })
  created_at: Date;
}
export const MinuteSchema = SchemaFactory.createForClass(Minutes);
