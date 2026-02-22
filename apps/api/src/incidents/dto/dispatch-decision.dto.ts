import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignmentDto {
  @IsUUID()
  resourceId: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class DispatchDecisionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  assignments: AssignmentDto[];
}
