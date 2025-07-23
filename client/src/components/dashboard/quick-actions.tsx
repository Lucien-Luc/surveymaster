import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Copy, Upload, Download, Plus } from "lucide-react";

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Link href="/survey/new">
            <Button variant="outline" className="w-full justify-start">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Create New Survey
            </Button>
          </Link>
          
          <Button variant="outline" className="w-full justify-start">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Copy className="w-4 h-4 text-green-600" />
            </div>
            Use Template
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            Import Survey
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Download className="w-4 h-4 text-orange-600" />
            </div>
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
