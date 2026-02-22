import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  type: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  peopleInsideUnknown?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  severity?: number;
}
