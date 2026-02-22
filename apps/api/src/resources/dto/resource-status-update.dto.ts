import { IsIn } from 'class-validator';
import { RESOURCE_STATUSES } from '@dispatcher/shared';

export class ResourceStatusUpdateDto {
  @IsIn(RESOURCE_STATUSES)
  status: (typeof RESOURCE_STATUSES)[number];
}
