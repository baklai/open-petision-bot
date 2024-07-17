import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Petition, PetitionSchema } from 'src/schemas/petition.schema';

import { ScrapersService } from './scrapers.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Petition.name, schema: PetitionSchema }])],
  providers: [ScrapersService],
  exports: [ScrapersService]
})
export class ScrapersModule {}
