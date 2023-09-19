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
      console.log(date.date() , moment.utc().date());

      while (date.date() <= moment.utc().date()) {
        console.log(date.date() <= moment.utc().date());
        
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
        date = moment.utc(start_date).add(1, 'day');
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

  async insertNSDPoints(no_of_points: number, start_time: any) {
    try {
      const graph_data = [];
      let point_time = start_time;
      for (let point = 0; point < no_of_points; point++) {
        graph_data.push({
          status: 'nsd',
          vx: 0,
          vy: 0,
          vz: 0,
          created_at: point_time,
        });
        point_time = moment(point_time).add({ minute: 10 });
      }
      return graph_data;
    } catch (error) {
      console.log('error in insertnsd points', error);
      return [];
    }
  }

  async initialPacketCheck(data: any, start_time: any) {
    try {
      let graph_data = [];
      const difference = Number(
        moment.utc(data['created_at']).diff(start_time, 'minute'),
      );
      console.log('value of difference', difference);
      if (difference >= 19) {
        const no_of_points = Number((difference / 10).toFixed(0));
        graph_data = await this.insertNSDPoints(no_of_points, start_time);
      }
      return graph_data;
    } catch (error) {
      console.log('error in initial packet check', error);
      return [];
    }
  }

  async endPacketCheck(data: any, end_time: any) {
    try {
      let graph_data = [];
      const difference = Number(
        moment.utc(end_time).diff(data['created_at'], 'minute'),
      );
      console.log('value of difference', difference);
      if (difference >= 19) {
        const no_of_points = Number((difference / 10).toFixed(0));
        let point_time = moment.utc(data['created_at'])
        point_time = moment.utc(point_time).add({ minute: 10 });
        if (no_of_points > 1) {
          graph_data = await this.insertNSDPoints(no_of_points - 1, point_time);
        }
      }
      return graph_data;
    } catch (error) {
      console.log('error in initial packet check', error);
      return [];
    }
  }

  async computeNSD() {
    try {
      const start_time = '2023-09-09T17:30:00Z';
      const end_time = '2023-09-09T18:30:00Z';
      // eslint-disable-next-line prettier/prettier, prefer-const
      let point_time: any = start_time;
      // const end_time = '2023-09-09T:18:30:00Z';
      const data = [
        {
          vx: 20,
          vy: 30,
          vz: 40,
          created_at: '2023-09-09T17:30:00Z',
        },
        {
          vx: 20,
          vy: 30,
          vz: 40,
          created_at: '2023-09-09T18:10:00Z',
        },
      ];
      let graph_data = [];
      graph_data = await this.initialPacketCheck(data[0], start_time);
      if (graph_data.length > 0) {
        point_time = moment.utc(
          graph_data[graph_data.length - 1]['created_at'],
        );
      }
      console.log('value of point time', point_time);
      for (let packet = 0; packet < data.length; packet++) {
        const difference = Number(
          moment.utc(data[packet]['created_at']).diff(point_time, 'minute'),
        );
        console.log('value odf poin time', point_time);
        console.log('value of packet', moment.utc(data[packet]['created_at']));
        console.log('value o difference', difference);
        console.log('value o difference condtion', difference >= 19);
        if (difference >= 19) {
          console.log('reached condition');
          let no_of_points = Number((difference / 10).toFixed(0));
          point_time = moment.utc(point_time).add({ minute: 10 });
          no_of_points = no_of_points > 1 ? no_of_points - 1 : 1;
          console.log('value of no of points', no_of_points);
          const new_data = await this.insertNSDPoints(no_of_points, point_time);
          console.log('new data', new_data);
          graph_data = graph_data.concat(new_data);
          point_time = moment.utc(
            graph_data[graph_data.length - 1]['created_at'],
          );
        } else {
          point_time = moment.utc(data[packet]['created_at']);
          graph_data.push(data[packet]);
        }
      }
      point_time = moment.utc(point_time).add({ minute: 10 });
      const end_packet = await this.endPacketCheck(
        graph_data[graph_data.length - 1],
        end_time,
      );
      graph_data = graph_data.concat(end_packet);
      return {
        graph_data,
      };
    } catch (error) {
      console.log('error in compute NSD', error);
    }
  }
}
