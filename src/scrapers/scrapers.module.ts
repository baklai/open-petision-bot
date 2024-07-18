import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from 'src/schemas/user.schema';
import { Petition, PetitionSchema } from 'src/schemas/petition.schema';

import { ScrapersService } from './scrapers.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { TelegramModule } from 'src/telegram/telegram.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Petition.name, schema: PetitionSchema }
    ])
  ],
  providers: [ScrapersService],
  exports: [ScrapersService]
})
export class ScrapersModule {}
