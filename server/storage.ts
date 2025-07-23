import { Survey, SurveyResponse, User, InsertSurvey, InsertResponse, InsertUser } from "@shared/schema";

// Firebase storage interface - not needed for actual implementation
// since we're using Firebase directly in components, but kept for consistency
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Survey methods
  getSurvey(id: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey>;
  
  // Response methods
  getResponses(surveyId: string): Promise<SurveyResponse[]>;
  createResponse(response: InsertResponse): Promise<SurveyResponse>;
}

// This is a placeholder class since we're using Firebase directly
// In a real serverless Firebase app, this wouldn't be needed
export class FirebaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    throw new Error("Use Firebase directly in components");
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Use Firebase directly in components");
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error("Use Firebase directly in components");
  }

  async getSurvey(id: string): Promise<Survey | undefined> {
    throw new Error("Use Firebase directly in components");
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    throw new Error("Use Firebase directly in components");
  }

  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey> {
    throw new Error("Use Firebase directly in components");
  }

  async getResponses(surveyId: string): Promise<SurveyResponse[]> {
    throw new Error("Use Firebase directly in components");
  }

  async createResponse(response: InsertResponse): Promise<SurveyResponse> {
    throw new Error("Use Firebase directly in components");
  }
}

export const storage = new FirebaseStorage();
