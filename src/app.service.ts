import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { MinutesTimeSeries } from './schema/minute-time-series';
import { Minutes } from './schema/minute.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  constructor(
    @InjectModel('minutes')
    public minutesModel: Model<Minutes>,

    @InjectModel('minutes_time_series')
    public minuteTimeSeries: Model<MinutesTimeSeries>,
  ) { }
  async generateData(params: Record<string, any>) {
    try {
      const data = [];
      const max = 50.75;
      const min = 0.5;
      const start_date = params['start_date'];
      let date = moment.utc(start_date);
      
      while (date.valueOf() <= moment.utc().valueOf()) {
        console.log(date.format('YYYY-MM-DD HH:mm:ss') , moment.utc().valueOf());
        
        for (let hour = 0; hour < 24; hour++) {
          for (let minute = 10; minute <= 60; minute = minute + 10) {
            const created_at = moment(date).utcOffset(0).set({
              hour: hour,
              minute,
              seconds: 0,
            });
            data.push({
              sensor_id: Number(params['sensor_id']),
              vx: Number((Math.random() * (max - min)).toFixed(2)),
              vy: Number((Math.random() * (max - min)).toFixed(2)),
              vz: Number((Math.random() * (max - min)).toFixed(2)),
              created_at: created_at,
            });
          }
        }
        await this.minutesModel.insertMany(data);
        await this.minuteTimeSeries.insertMany(data);
        date = moment.utc(date).add(1, 'day');
      }
      console.log('data inserted into db');
      return {
        total_points: data.length,
        data: data,
      };
    } catch (error) {
      console.log('error in data generation', error);
    }
  }

  async fetchData() {
    const hourlyHighest = await this.minutesModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
            day: { $dayOfMonth: '$created_at' },
            hour: { $hour: '$created_at' },
          },
          avg: { $avg: '$vx' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
          '_id.hour': 1,
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default "_id" field
          created_at: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour',
            },
          },
          avg: 1,
        },
      },
    ]);
    return {
      data: hourlyHighest,
    };
  }
  async fechTimeSeriesData() {
    const hourlyHighest = await this.minuteTimeSeries.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
            day: { $dayOfMonth: '$created_at' },
            hour: { $hour: '$created_at' },
          },
          avg: { $avg: '$vx' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
          '_id.hour': 1,
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default "_id" field
          created_at: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour',
            },
          },
          avg: 1,
        },
      },
    ]);
    return {
      data: hourlyHighest,
    };
  }


}
