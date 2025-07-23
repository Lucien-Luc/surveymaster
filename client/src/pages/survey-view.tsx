import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { SurveyPreview } from "@/components/survey/survey-preview";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Survey } from "@shared/schema";
import { AlertCircle } from "lucide-react";

export default function SurveyView() {
  const [, params] = useRoute("/survey/:id");

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['survey', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('No survey ID provided');
      
      const surveyRef = doc(db, 'surveys', params.id);
      const snapshot = await getDoc(surveyRef);
      
      if (!snapshot.exists()) {
        throw new Error('Survey not found');
      }
      
      const surveyData = snapshot.data();
      
      // Check if survey is active
      if (surveyData.status !== 'active') {
        throw new Error('Survey is not currently active');
      }
      
      return {
        id: snapshot.id,
        ...surveyData,
        createdAt: surveyData.createdAt?.toDate(),
        updatedAt: surveyData.updatedAt?.toDate()
      } as Survey;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Survey Unavailable</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {error.message || 'This survey is not available or has been removed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (survey) {
    return (
      <SurveyPreview
        survey={survey}
        isPublic={true}
        onClose={() => {
          // Show thank you message or redirect
          window.location.href = '/';
        }}
      />
    );
  }

  return null;
}
