// Simple local storage system for survey data (demo purposes)
import { Survey, SurveyResponse } from "@shared/schema";
import { nanoid } from "nanoid";

class LocalStorageService {
  private readonly SURVEYS_KEY = 'surveyflow_surveys';
  private readonly RESPONSES_KEY = 'surveyflow_responses';

  // Survey CRUD operations
  async saveSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Survey> {
    const surveys = this.getSurveys();
    const newSurvey: Survey = {
      ...survey,
      id: nanoid(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: survey.status || 'draft',
      responseCount: 0
    };

    surveys.push(newSurvey);
    localStorage.setItem(this.SURVEYS_KEY, JSON.stringify(surveys));
    return newSurvey;
  }

  async updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<Survey> {
    const surveys = this.getSurveys();
    const index = surveys.findIndex(s => s.id === surveyId);
    
    if (index === -1) {
      throw new Error('Survey not found');
    }

    const updatedSurvey = {
      ...surveys[index],
      ...updates,
      updatedAt: new Date()
    };

    surveys[index] = updatedSurvey;
    localStorage.setItem(this.SURVEYS_KEY, JSON.stringify(surveys));
    return updatedSurvey;
  }

  getSurveys(userId?: string): Survey[] {
    try {
      const surveys = JSON.parse(localStorage.getItem(this.SURVEYS_KEY) || '[]') as Survey[];
      return userId 
        ? surveys.filter(s => s.createdBy === userId).map(this.parseSurveyDates)
        : surveys.map(this.parseSurveyDates);
    } catch {
      return [];
    }
  }

  getSurvey(surveyId: string): Survey | null {
    const surveys = this.getSurveys();
    const survey = surveys.find(s => s.id === surveyId);
    return survey ? this.parseSurveyDates(survey) : null;
  }

  async deleteSurvey(surveyId: string): Promise<void> {
    const surveys = this.getSurveys();
    const filteredSurveys = surveys.filter(s => s.id !== surveyId);
    localStorage.setItem(this.SURVEYS_KEY, JSON.stringify(filteredSurveys));
  }

  // Response CRUD operations
  async saveResponse(response: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<SurveyResponse> {
    const responses = this.getResponses();
    const newResponse: SurveyResponse = {
      ...response,
      id: nanoid(),
      submittedAt: new Date()
    };

    responses.push(newResponse);
    localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(responses));

    // Update survey response count
    await this.incrementResponseCount(response.surveyId);
    
    return newResponse;
  }

  getResponses(surveyId?: string): SurveyResponse[] {
    try {
      const responses = JSON.parse(localStorage.getItem(this.RESPONSES_KEY) || '[]') as SurveyResponse[];
      return surveyId 
        ? responses.filter(r => r.surveyId === surveyId).map(this.parseResponseDates)
        : responses.map(this.parseResponseDates);
    } catch {
      return [];
    }
  }

  // Utility methods
  private async incrementResponseCount(surveyId: string): Promise<void> {
    const survey = this.getSurvey(surveyId);
    if (survey) {
      await this.updateSurvey(surveyId, {
        responseCount: (survey.responseCount || 0) + 1
      });
    }
  }

  private parseSurveyDates(survey: any): Survey {
    return {
      ...survey,
      createdAt: survey.createdAt ? new Date(survey.createdAt) : new Date(),
      updatedAt: survey.updatedAt ? new Date(survey.updatedAt) : new Date()
    };
  }

  private parseResponseDates(response: any): SurveyResponse {
    return {
      ...response,
      submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date()
    };
  }

  // Analytics and stats
  getAnalytics(userId: string) {
    const surveys = this.getSurveys(userId);
    const allResponses = this.getResponses();
    
    const userResponses = allResponses.filter(r => 
      surveys.some(s => s.id === r.surveyId)
    );

    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.status === 'active').length;
    const totalResponses = userResponses.length;
    const thisMonthResponses = userResponses.filter(r => {
      const responseDate = new Date(r.submittedAt);
      const now = new Date();
      return responseDate.getMonth() === now.getMonth() && 
             responseDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalSurveys,
      activeSurveys,
      totalResponses,
      thisMonthResponses,
      recentActivity: userResponses
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10)
    };
  }
}

export const storageService = new LocalStorageService();