import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from "wouter";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Survey } from "@shared/schema";
import { Edit3, BarChart3, Share2, MoreHorizontal, Search, Filter, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SurveyShare } from "@/components/survey/survey-share";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SurveyList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shareModalSurvey, setShareModalSurvey] = useState<Survey | null>(null);

  const updateSurveyStatusMutation = useMutation({
    mutationFn: async ({ surveyId, status }: { surveyId: string; status: string }) => {
      const surveyRef = doc(db, 'surveys', surveyId);
      await updateDoc(surveyRef, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast({
        title: "Survey updated",
        description: "Survey status has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update survey status.",
        variant: "destructive"
      });
    }
  });

  const handleToggleStatus = (survey: Survey) => {
    const newStatus = survey.status === 'active' ? 'draft' : 'active';
    updateSurveyStatusMutation.mutate({ surveyId: survey.id, status: newStatus });
  };

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys', user?.uid],
    queryFn: async () => {
      if (!user) return [];

      const surveysRef = collection(db, 'surveys');
      const q = query(
        surveysRef,
        where('createdBy', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Survey));
    },
    enabled: !!user
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'draft': return '🟡';
      case 'completed': return '🔵';
      case 'archived': return '⚫';
      default: return '⚫';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Surveys</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!surveys || surveys.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
            <p className="text-gray-600 mb-4">Create your first survey to get started</p>
            <Link href="/survey/new">
              <Button>Create Survey</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{survey.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{survey.responseCount} responses</span>
                      <Badge className={getStatusColor(survey.status)}>
                        {getStatusIcon(survey.status)} {survey.status}
                      </Badge>
                      <span>
                        Updated {formatDistanceToNow(survey.updatedAt || new Date())} ago
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(survey);
                    }}
                    disabled={updateSurveyStatusMutation.isPending}
                    title={survey.status === 'active' ? 'Deactivate survey' : 'Activate survey'}
                  >
                    {survey.status === 'active' ? (
                      <Pause className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Play className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <Link href={`/survey/${survey.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit survey">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/survey/${survey.id}/responses`}>
                    <Button variant="ghost" size="sm" title="View responses">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareModalSurvey(survey);
                    }}
                    title="Share survey"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Share Modal */}
    {shareModalSurvey && (
      <SurveyShare
        survey={shareModalSurvey}
        onClose={() => setShareModalSurvey(null)}
      />
    )}
  </>
  );
}
