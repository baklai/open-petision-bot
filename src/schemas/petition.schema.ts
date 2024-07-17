import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, IsMongoId, IsOptional, IsDate } from 'class-validator';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Petition {
  @IsString()
  @IsMongoId()
  readonly id: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly tag: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly date: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly timer: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly status: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly counts: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly title: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly link: string;

  @IsString()
  @IsOptional()
  @Prop({ type: String, trim: true })
  readonly number: string;

  @IsDate()
  @IsOptional()
  readonly createdAt: Date;

  @IsDate()
  @IsOptional()
  readonly updatedAt: Date;
}

export type PetitionDocument = HydratedDocument<Petition>;

export const PetitionSchema = SchemaFactory.createForClass(Petition);
