import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

import AppConfig from './configs/app.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TelegramModule } from './telegram/telegram.module';
import { ScrapersModule } from './scrapers/scrapers.module';

import { User, UserSchema } from './schemas/user.schema';
import { Petition, PetitionSchema } from './schemas/petition.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [AppConfig]
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: connection => {
          connection.plugin((schema: Schema) => {
            schema.set('autoCreate', false);
            schema.set('versionKey', false);
            schema.set('timestamps', true);
            schema.virtual('id').get(function () {
              return this._id;
            });
            schema.set('toJSON', {
              virtuals: true,
              transform: function (doc, ret) {
                delete ret._id;
              }
            });
            schema.set('toObject', {
              virtuals: true,
              transform: function (doc, ret) {
                delete ret._id;
              }
            });
          });

          return connection;
        }
      })
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Petition.name, schema: PetitionSchema }
    ]),
    TelegramModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        config: {}
      })
    }),
    ScrapersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
