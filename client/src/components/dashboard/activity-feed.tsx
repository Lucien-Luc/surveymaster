import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Edit3, Share2, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'survey_created' | 'survey_updated' | 'response_received' | 'survey_shared';
  description: string;
  timestamp: Date;
  surveyId?: string;
  surveyTitle?: string;
}

export default function ActivityFeed() {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', user?.uid],
    queryFn: async () => {
      if (!user) return [];

      // Get recent surveys for activity generation
      const surveysRef = collection(db, 'surveys');
      const surveysQuery = query(
        surveysRef,
        where('createdBy', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );
      
      const surveysSnapshot = await getDocs(surveysQuery);
      const activities: Activity[] = [];

      // Generate activities from surveys
      surveysSnapshot.docs.forEach(doc => {
        const surveyData = doc.data();
        const survey = { 
          id: doc.id, 
          title: surveyData.title || 'Untitled Survey',
          createdAt: surveyData.createdAt,
          updatedAt: surveyData.updatedAt,
          responseCount: surveyData.responseCount || 0,
          ...surveyData
        };
        
        // Survey created activity
        activities.push({
          id: `created_${survey.id}`,
          type: 'survey_created',
          description: `Survey "${survey.title}" was created`,
          timestamp: survey.createdAt?.toDate() || new Date(),
          surveyId: survey.id,
          surveyTitle: survey.title
        });

        // Survey updated activity (if different from created)
        if (survey.updatedAt && survey.createdAt && 
            survey.updatedAt.toMillis() !== survey.createdAt.toMillis()) {
          activities.push({
            id: `updated_${survey.id}`,
            type: 'survey_updated',
            description: `Survey "${survey.title}" was updated`,
            timestamp: survey.updatedAt?.toDate() || new Date(),
            surveyId: survey.id,
            surveyTitle: survey.title
          });
        }

        // Response received activities
        if (survey.responseCount > 0) {
          activities.push({
            id: `responses_${survey.id}`,
            type: 'response_received',
            description: `Survey "${survey.title}" received ${survey.responseCount} responses`,
            timestamp: survey.updatedAt?.toDate() || new Date(),
            surveyId: survey.id,
            surveyTitle: survey.title
          });
        }
      });

      // Sort by timestamp and return most recent
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    },
    enabled: !!user
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_created': return Plus;
      case 'survey_updated': return Edit3;
      case 'response_received': return CheckCircle;
      case 'survey_shared': return Share2;
      default: return Plus;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'survey_created': return 'bg-primary/10 text-primary';
      case 'survey_updated': return 'bg-green-100 text-green-600';
      case 'response_received': return 'bg-blue-100 text-blue-600';
      case 'survey_shared': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${getActivityColor(activity.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(activity.timestamp)} ago
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
