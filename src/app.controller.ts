import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('nsd')
  async computeNSD() {
    console.log('got hit');
    return await this.appService.computeNSD();
  }

  @Get('generate-data')
  async generateData(@Query() query) {
    return await this.appService.generateData(query);
  }

  @Get('fetch-data')
  async fetchData() {
    return await this.appService.fetchData();
  }

  @Get('fetch-time-data')
  async fechTimeSeriesData() {
    return await this.appService.fechTimeSeriesData();
  }
}
