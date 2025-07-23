import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Survey, Question } from "@shared/schema";
import { ArrowLeft, ArrowRight, Edit3, X, Clock, HelpCircle, Shield } from "lucide-react";

interface SurveyPreviewProps {
  survey: Survey;
  onClose: () => void;
  onEdit?: () => void;
  isPublic?: boolean;
}

export function SurveyPreview({ survey, onClose, onEdit, isPublic = false }: SurveyPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Track survey start time for completion analytics
  useEffect(() => {
    (window as any).surveyStartTime = Date.now();
  }, []);

  const questionsPerPage = 3;
  const totalPages = Math.ceil(survey.questions.length / questionsPerPage);
  const currentQuestions = survey.questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Import Firebase functions
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const { nanoid } = await import('nanoid');
      
      // Validate required fields
      const requiredQuestions = survey.questions.filter(q => q.required);
      const missingRequiredFields = requiredQuestions.filter(q => 
        !responses[q.id] || (Array.isArray(responses[q.id]) && responses[q.id].length === 0)
      );
      
      if (missingRequiredFields.length > 0) {
        alert(`Please complete all required fields: ${missingRequiredFields.map(q => q.text).join(', ')}`);
        return;
      }

      // Create response object
      const responseData = {
        surveyId: survey.id,
        responses,
        submittedAt: serverTimestamp(),
        isComplete: true,
        completionTime: Date.now() - (window as any).surveyStartTime || 0,
        ipAddress: 'hidden',
        userAgent: navigator.userAgent
      };

      // Save to Firestore
      const responsesRef = collection(db, 'responses');
      await addDoc(responsesRef, responseData);

      // Show success message
      alert('Thank you! Your survey response has been submitted successfully.');
      
      if (!isPublic) {
        onClose();
      } else {
        // Redirect to a thank you page or close
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('There was an error submitting your response. Please try again.');
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const estimatedTime = Math.max(3, Math.ceil(survey.questions.length * 0.5));

  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      {/* Header */}
      {!isPublic && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Survey Preview</h2>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Survey
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-6">
        {/* Survey Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">{survey.description}</p>
          )}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>~{estimatedTime} minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <HelpCircle className="w-4 h-4" />
              <span>{survey.questions.length} questions</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Anonymous</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {survey.settings?.showProgressBar && totalPages > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentPage + 1) / totalPages) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {currentQuestions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              questionNumber={currentPage * questionsPerPage + index + 1}
              value={responses[question.id]}
              onChange={(value) => handleResponseChange(question.id, value)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>

          {currentPage < totalPages - 1 ? (
            <Button onClick={nextPage}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              Submit Survey
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  value: any;
  onChange: (value: any) => void;
}

function QuestionRenderer({ question, questionNumber, value, onChange }: QuestionRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer"
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="your.email@example.com"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer"
            rows={4}
          />
        );

      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const scale = question.scale || { min: 1, max: 5 };
        const scaleValues = Array.from(
          { length: scale.max - scale.min + 1 }, 
          (_, i) => scale.min + i
        );
        
        return (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 min-w-max">
              {scale.minLabel || scale.min}
            </span>
            <div className="flex space-x-2">
              {scaleValues.map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center ${
                    value === num
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-primary text-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-600 min-w-max">
              {scale.maxLabel || scale.max}
            </span>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        return <div className="text-gray-400">Question type not supported</div>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium text-gray-900 pr-4">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <span className="text-sm text-gray-500 font-medium">
              {questionNumber}
            </span>
          </div>
          {question.helpText && (
            <p className="text-sm text-gray-600 mt-2">{question.helpText}</p>
          )}
        </div>
        {renderInput()}
      </CardContent>
    </Card>
  );
}
