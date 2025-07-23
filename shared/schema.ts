import { z } from "zod";

// Question Types
export const questionTypes = [
  'text',
  'textarea', 
  'multiple-choice',
  'checkbox',
  'rating',
  'date',
  'email'
] as const;

export type QuestionType = typeof questionTypes[number];

// Question Schema
export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(questionTypes),
  text: z.string().min(1, "Question text is required"),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number(),
  options: z.array(z.string()).optional(), // for multiple choice/checkbox
  scale: z.object({
    min: z.number(),
    max: z.number(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional()
  }).optional(), // for rating questions
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional()
  }).optional(),
  skipLogic: z.object({
    conditions: z.array(z.object({
      questionId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.string()
    }))
  }).optional()
});

// Survey Schema
export const surveySchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Survey title is required"),
  description: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
  questions: z.array(questionSchema),
  settings: z.object({
    allowAnonymous: z.boolean().default(true),
    requireAuth: z.boolean().default(false),
    multipleSubmissions: z.boolean().default(false),
    showProgressBar: z.boolean().default(true),
    submissionLimit: z.number().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional()
  }).optional(),
  responseCount: z.number().default(0),
  shareUrl: z.string().optional()
});

// Survey Response Schema
export const surveyResponseSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  respondentId: z.string().optional(), // for authenticated responses
  responses: z.record(z.string(), z.any()), // questionId -> answer
  submittedAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  completionTime: z.number().optional(), // in seconds
  isComplete: z.boolean().default(false)
});

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true)
  }).optional()
});

// Insert schemas
export const insertSurveySchema = surveySchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  responseCount: true 
});

export const insertQuestionSchema = questionSchema.omit({ 
  id: true 
});

export const insertResponseSchema = surveyResponseSchema.omit({ 
  id: true 
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type Question = z.infer<typeof questionSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type User = z.infer<typeof userSchema>;

export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Survey statistics
export const surveyStatsSchema = z.object({
  totalSurveys: z.number(),
  totalResponses: z.number(),
  activeSurveys: z.number(),
  completionRate: z.number()
});

export type SurveyStats = z.infer<typeof surveyStatsSchema>;
