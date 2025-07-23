import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Survey } from "@shared/schema";
import { Copy, Share2, QrCode, Mail, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SurveyShareProps {
  survey: Survey;
  onClose?: () => void;
}

export function SurveyShare({ survey, onClose }: SurveyShareProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  
  // Generate survey URL
  const surveyUrl = `${window.location.origin}/survey/${survey.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setIsCopied(true);
      toast({
        title: "Link copied!",
        description: "Survey link has been copied to your clipboard."
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please copy manually.",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = `Survey: ${survey.title}`;
    const body = `Hi there!\n\nI'd like to invite you to participate in my survey: "${survey.title}"\n\n${survey.description || ''}\n\nPlease click the following link to take the survey:\n${surveyUrl}\n\nThank you for your time!`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const generateQRCode = () => {
    // Simple QR code using a free API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(surveyUrl)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Survey</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Survey Info */}
          <div>
            <h3 className="font-medium text-gray-900">{survey.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
          </div>

          {/* Survey Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Link
            </label>
            <div className="flex space-x-2">
              <Input
                value={surveyUrl}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className={isCopied ? "bg-green-50 border-green-200" : ""}
              >
                {isCopied ? (
                  "Copied!"
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Share Options</h4>
            
            <Button
              variant="outline"
              onClick={handleEmailShare}
              className="w-full justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </Button>

            <Button
              variant="outline"
              onClick={generateQRCode}
              className="w-full justify-start"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this survey: ${survey.title}`)}&url=${encodeURIComponent(surveyUrl)}`, '_blank')}
              className="w-full justify-start"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Share on Twitter
            </Button>
          </div>

          {/* Survey Statistics */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                survey.status === 'active' ? 'text-green-600' :
                survey.status === 'draft' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {survey.status}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Responses:</span>
              <span className="font-medium">{survey.responseCount || 0}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleCopyLink} className="flex-1">
              <Link2 className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}