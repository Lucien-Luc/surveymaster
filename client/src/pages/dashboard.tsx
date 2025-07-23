import { Card, CardContent } from "@/components/ui/card";
import DashboardStats from "@/components/dashboard/dashboard-stats";
import SurveyList from "@/components/dashboard/survey-list";
import ActivityFeed from "@/components/dashboard/activity-feed";
import QuickActions from "@/components/dashboard/quick-actions";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your surveys and analyze responses</p>
          </div>
          <Link href="/survey/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create New Survey</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Survey List */}
        <div className="lg:col-span-2">
          <SurveyList />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActivityFeed />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
