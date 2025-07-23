import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { SurveyBuilder } from "@/components/survey/survey-builder";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Survey } from "@shared/schema";
import { AlertCircle } from "lucide-react";

export default function SurveyBuilderPage() {
  const [, params] = useRoute("/survey/:id/edit");
  const [, newRoute] = useRoute("/survey/new");
  
  const isEditing = !!params?.id;
  const isNewSurvey = !!newRoute;

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['survey', params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      
      // Use only local storage - no Firebase
      const localSurveys = JSON.parse(localStorage.getItem('surveyflow_surveys') || '[]');
      const survey = localSurveys.find((s: any) => s.id === params.id);
      if (!survey) {
        throw new Error('Survey not found');
      }
      return survey as Survey;
    },
    enabled: isEditing
  });

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Survey Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              The survey you're looking for doesn't exist or you don't have permission to edit it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isNewSurvey || (isEditing && survey)) {
    return (
      <SurveyBuilder 
        survey={survey || undefined}
        onSave={(savedSurvey) => {
          // Navigate to dashboard or survey view
          window.location.href = '/';
        }}
        onClose={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
