import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SurveyResponse, Survey } from "@shared/schema";
import { Download, Users, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SurveyResponsesProps {
  survey: Survey;
}

export function SurveyResponses({ survey }: SurveyResponsesProps) {
  const { data: responses, isLoading } = useQuery({
    queryKey: ['survey-responses', survey.id],
    queryFn: async () => {
      const responsesRef = collection(db, 'responses');
      const q = query(
        responsesRef,
        where('surveyId', '==', survey.id),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      } as SurveyResponse));
    }
  });

  const handleExportCSV = () => {
    if (!responses || responses.length === 0) return;

    // Create CSV headers
    const headers = ['Response ID', 'Submitted At', 'Completion Time', 'Complete'];
    survey.questions.forEach(q => headers.push(q.text));

    // Create CSV rows
    const rows = responses.map(response => {
      const row = [
        response.id,
        response.submittedAt?.toISOString() || '',
        response.completionTime?.toString() || '',
        response.isComplete ? 'Yes' : 'No'
      ];
      
      survey.questions.forEach(q => {
        const answer = response.responses[q.id];
        if (Array.isArray(answer)) {
          row.push(answer.join('; '));
        } else {
          row.push(answer?.toString() || '');
        }
      });
      
      return row;
    });

    // Generate CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedResponses = responses?.filter(r => r.isComplete).length || 0;
  const averageTime = responses?.length ? 
    Math.round((responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / responses.length) / 60) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{responses?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {responses?.length ? Math.round((completedResponses / responses.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg. Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{averageTime}m</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Individual Responses</CardTitle>
            <Button onClick={handleExportCSV} disabled={!responses?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!responses || responses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600">Responses will appear here once people start submitting your survey</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Response ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Submitted</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response) => (
                    <tr key={response.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{response.id.slice(-8)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {response.submittedAt ? formatDistanceToNow(response.submittedAt, { addSuffix: true }) : 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          response.isComplete 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {response.isComplete ? 'Complete' : 'Partial'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {response.completionTime ? `${Math.round(response.completionTime / 60)}m` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Details */}
      {responses && responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {survey.questions.map((question) => (
                <QuestionAnalysis
                  key={question.id}
                  question={question}
                  responses={responses}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface QuestionAnalysisProps {
  question: any;
  responses: SurveyResponse[];
}

function QuestionAnalysis({ question, responses }: QuestionAnalysisProps) {
  const answers = responses
    .map(r => r.responses[question.id])
    .filter(answer => answer !== undefined && answer !== null && answer !== '');

  const responseRate = responses.length > 0 ? Math.round((answers.length / responses.length) * 100) : 0;

  const renderAnalysis = () => {
    if (answers.length === 0) {
      return <p className="text-gray-500">No responses</p>;
    }

    switch (question.type) {
      case 'multiple-choice':
      case 'checkbox':
        const choices = question.options || [];
        const choiceCounts: Record<string, number> = {};
        
        answers.forEach(answer => {
          if (Array.isArray(answer)) {
            answer.forEach(choice => {
              choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
            });
          } else {
            choiceCounts[answer] = (choiceCounts[answer] || 0) + 1;
          }
        });

        return (
          <div className="space-y-2">
            {choices.map((choice: string) => {
              const count = choiceCounts[choice] || 0;
              const percentage = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
              
              return (
                <div key={choice} className="flex items-center justify-between">
                  <span className="text-gray-700">{choice}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{count} ({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'rating':
        const scale = question.scale || { min: 1, max: 5 };
        const ratings = answers.filter(a => typeof a === 'number');
        const average = ratings.length > 0 
          ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
          : 'N/A';

        return (
          <div>
            <p className="text-lg font-semibold text-gray-900">Average: {average}</p>
            <div className="mt-2 space-y-1">
              {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map(value => {
                const count = ratings.filter(r => r === value).length;
                const percentage = ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0;
                
                return (
                  <div key={value} className="flex items-center justify-between">
                    <span className="text-gray-700">{value}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'text':
      case 'textarea':
      case 'email':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{answers.length} text responses</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {answers.slice(0, 5).map((answer, index) => (
                <p key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                  {answer.toString().slice(0, 100)}{answer.toString().length > 100 ? '...' : ''}
                </p>
              ))}
              {answers.length > 5 && (
                <p className="text-sm text-gray-500">...and {answers.length - 5} more</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-600">
            {answers.length} responses
          </p>
        );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900">{question.text}</h4>
        <span className="text-sm text-gray-500">{responseRate}% response rate</span>
      </div>
      {renderAnalysis()}
    </div>
  );
}
