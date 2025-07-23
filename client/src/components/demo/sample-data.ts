// Sample data for demonstration purposes
import { Survey, Question } from "@shared/schema";
import { storageService } from "@/lib/storage-local";

export function createSampleSurveys(userId: string) {
  // Only create sample data if no surveys exist
  const existingSurveys = storageService.getSurveys(userId);
  if (existingSurveys.length > 0) return;

  const sampleQuestions: Question[] = [
    {
      id: "q1",
      type: "text",
      text: "What is your name?",
      required: true,
      order: 0
    },
    {
      id: "q2", 
      type: "email",
      text: "What is your email address?",
      required: true,
      order: 1
    },
    {
      id: "q3",
      type: "multiple-choice",
      text: "How satisfied are you with our service?",
      required: true,
      order: 2,
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      id: "q4",
      type: "textarea",
      text: "Please provide any additional feedback:",
      required: false,
      order: 3
    }
  ];

  const sampleSurvey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'> = {
    title: "Customer Satisfaction Survey",
    description: "Help us improve our services by sharing your feedback",
    createdBy: userId,
    questions: sampleQuestions,
    status: "active",
    responseCount: 3,
    settings: {
      allowAnonymous: true,
      requireAuth: false,
      showProgressBar: true,
      multipleSubmissions: false
    }
  };

  // Create the sample survey
  storageService.saveSurvey(sampleSurvey, userId);

  // Add some sample responses
  const survey = storageService.getSurveys(userId)[0];
  if (survey) {
    const sampleResponses = [
      {
        surveyId: survey.id,
        responses: {
          q1: "John Doe",
          q2: "john@example.com", 
          q3: "satisfied",
          q4: "Great service overall, keep it up!"
        }
      },
      {
        surveyId: survey.id,
        responses: {
          q1: "Jane Smith",
          q2: "jane@example.com",
          q3: "very_satisfied", 
          q4: "Excellent customer support and fast response times."
        }
      },
      {
        surveyId: survey.id,
        responses: {
          q1: "Mike Johnson",
          q2: "mike@example.com",
          q3: "neutral",
          q4: "Service was okay, but could be improved."
        }
      }
    ];

    sampleResponses.forEach(response => {
      storageService.saveResponse({
        ...response,
        isComplete: true
      });
    });
  }
}