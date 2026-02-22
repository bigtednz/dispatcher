import { z } from 'zod';
import { CAPABILITIES, INCIDENT_TYPES, RESOURCE_STATUSES } from './enums.js';

export const capabilitySchema = z.enum(CAPABILITIES);
export const incidentTypeSchema = z.enum(INCIDENT_TYPES);
export const resourceStatusSchema = z.enum(RESOURCE_STATUSES);

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1).max(200),
});

export const createIncidentSchema = z.object({
  type: incidentTypeSchema,
  priority: z.number().int().min(1).max(5),
  location: locationSchema,
  label: z.string().optional(),
  peopleInsideUnknown: z.boolean().optional(),
  severity: z.number().min(0).max(100).optional(),
});

export const dispatchDecisionSchema = z.object({
  assignments: z.array(
    z.object({
      resourceId: z.string().uuid(),
      role: z.string().optional(),
    })
  ),
});

export const resourceStatusUpdateSchema = z.object({
  status: resourceStatusSchema,
});

export const ruleConditionSchema = z.record(z.unknown());
export const ruleRecommendSchema = z.object({
  requiredCapabilities: z.array(capabilitySchema),
  minimumCounts: z.record(capabilitySchema, z.number().int().min(0)).optional(),
  maxTravelMinutes: z.number().min(0).optional(),
});
export const ruleScoreWeightsSchema = z.record(z.number()).optional();
