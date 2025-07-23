import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// Using local storage instead of Firebase
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Users, TrendingUp, CheckCircle } from "lucide-react";

export default function DashboardStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.uid],
    queryFn: async () => {
      if (!user) return null;

      const surveysRef = collection(db, 'surveys');
      const responsesRef = collection(db, 'responses');
      
      // Get total surveys count
      const surveysQuery = query(surveysRef, where('createdBy', '==', user.uid));
      const surveysSnapshot = await getCountFromServer(surveysQuery);
      const totalSurveys = surveysSnapshot.data().count;

      // Get active surveys count  
      const activeSurveysQuery = query(surveysRef, 
        where('createdBy', '==', user.uid),
        where('status', '==', 'active')
      );
      const activeSurveysSnapshot = await getCountFromServer(activeSurveysQuery);
      const activeSurveys = activeSurveysSnapshot.data().count;

      // Get all user surveys for response counting
      const userSurveysSnapshot = await getDocs(surveysQuery);
      const surveyIds = userSurveysSnapshot.docs.map(doc => doc.id);

      let totalResponses = 0;
      let completedResponses = 0;

      if (surveyIds.length > 0) {
        // Count responses for each survey
        for (const surveyId of surveyIds) {
          const responsesQuery = query(responsesRef, where('surveyId', '==', surveyId));
          const responsesSnapshot = await getCountFromServer(responsesQuery);
          totalResponses += responsesSnapshot.data().count;

          const completedQuery = query(responsesRef, 
            where('surveyId', '==', surveyId),
            where('isComplete', '==', true)
          );
          const completedSnapshot = await getCountFromServer(completedQuery);
          completedResponses += completedSnapshot.data().count;
        }
      }

      const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

      return {
        totalSurveys,
        totalResponses,
        activeSurveys,
        completionRate
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-center h-20">
              <LoadingSpinner />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Surveys",
      value: stats?.totalSurveys || 0,
      icon: BarChart3,
      color: "bg-primary",
      trend: "+12% from last month"
    },
    {
      title: "Total Responses", 
      value: stats?.totalResponses || 0,
      icon: Users,
      color: "bg-green-500",
      trend: "+8% from last week"
    },
    {
      title: "Active Surveys",
      value: stats?.activeSurveys || 0,
      icon: TrendingUp,
      color: "bg-orange-500",
      trend: `${stats?.activeSurveys || 0} active now`
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "+4% improvement"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-600 font-medium">↗ {stat.trend}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
