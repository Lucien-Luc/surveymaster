import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { SurveyResponses } from "@/components/survey/survey-responses";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Survey } from "@shared/schema";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function SurveyResponsesPage() {
  const [, params] = useRoute("/survey/:id/responses");

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['survey', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('No survey ID provided');
      
      const surveyRef = doc(db, 'surveys', params.id);
      const snapshot = await getDoc(surveyRef);
      
      if (!snapshot.exists()) {
        throw new Error('Survey not found');
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate()
      } as Survey;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Survey Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              The survey you're looking for doesn't exist or you don't have permission to view its responses.
            </p>
            <Link href="/">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
          <p className="text-gray-600 mt-1">Survey responses and analytics</p>
        </div>
      </div>

      {/* Responses */}
      <SurveyResponses survey={survey} />
    </div>
  );
}
