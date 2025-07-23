import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Question, QuestionType, Survey, InsertSurvey } from "@shared/schema";
import { 
  Eye, Save, X, Plus, Settings, Move, Copy, Trash2, GripVertical, 
  Type, CheckSquare, List, Star, Calendar, Mail, Hash, 
  AlignLeft, MessageSquare, BarChart3
} from "lucide-react";
import { nanoid } from "nanoid";

interface SurveyBuilderProps {
  survey?: Survey;
  onSave?: (survey: Survey) => void;
  onClose?: () => void;
}

// Question type definitions for the survey builder
const QUESTION_TYPES = [
  { type: 'text' as QuestionType, label: 'Short Text', icon: Type, description: 'Single line text input' },
  { type: 'textarea' as QuestionType, label: 'Long Text', icon: AlignLeft, description: 'Multi-line text input' },
  { type: 'multiple-choice' as QuestionType, label: 'Multiple Choice', icon: List, description: 'Single selection from options' },
  { type: 'checkbox' as QuestionType, label: 'Checkboxes', icon: CheckSquare, description: 'Multiple selections from options' },
  { type: 'rating' as QuestionType, label: 'Rating Scale', icon: Star, description: 'Numeric rating scale' },
  { type: 'email' as QuestionType, label: 'Email', icon: Mail, description: 'Email address input' },
  { type: 'date' as QuestionType, label: 'Date', icon: Calendar, description: 'Date picker' },
];

export function SurveyBuilder({ survey, onSave, onClose }: SurveyBuilderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(survey?.title || "");
  const [description, setDescription] = useState(survey?.description || "");
  const [questions, setQuestions] = useState<Question[]>(survey?.questions || []);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const saveSurveyMutation = useMutation({
    mutationFn: async (surveyData: Partial<InsertSurvey>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Use local storage for now (Firebase will be optional)
      const now = new Date();
      const localSurveys = JSON.parse(localStorage.getItem('surveyflow_surveys') || '[]');
      
      if (survey?.id) {
        // Update existing survey in local storage
        const updatedSurveys = localSurveys.map((s: any) => 
          s.id === survey.id ? { ...s, ...surveyData, updatedAt: now } : s
        );
        localStorage.setItem('surveyflow_surveys', JSON.stringify(updatedSurveys));
        return { ...survey, ...surveyData, updatedAt: now };
      } else {
        // Create new survey in local storage
        const newSurvey = {
          id: nanoid(),
          title: surveyData.title || 'Untitled Survey',
          description: surveyData.description,
          questions: surveyData.questions || [],
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
          status: 'draft' as const,
          responseCount: 0
        };
        localSurveys.push(newSurvey);
        localStorage.setItem('surveyflow_surveys', JSON.stringify(localSurveys));
        return newSurvey;
      }
    },
    onSuccess: (savedSurvey) => {
      toast({
        title: "Survey saved",
        description: "Your survey has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      onSave?.(savedSurvey);
    },
    onError: (error) => {
      toast({
        title: "Error saving survey",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addQuestion = useCallback((type: QuestionType) => {
    const newQuestion: Question = {
      id: nanoid(),
      type,
      text: `New ${QUESTION_TYPES.find(qt => qt.type === type)?.label || 'Question'}`,
      required: false,
      order: questions.length
    };

    // Add default properties based on question type
    if (type === 'multiple-choice' || type === 'checkbox') {
      newQuestion.options = ['Option 1', 'Option 2'];
    } else if (type === 'rating') {
      newQuestion.scale = { min: 1, max: 5 };
    }

    setQuestions(prev => [...prev, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
  }, [questions.length]);

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null);
    }
  }, [selectedQuestionId]);

  const duplicateQuestion = useCallback((id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const duplicate = {
        ...question,
        id: nanoid(),
        text: `${question.text} (Copy)`,
        order: questions.length
      };
      setQuestions(prev => [...prev, duplicate]);
    }
  }, [questions]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your survey.",
        variant: "destructive"
      });
      return;
    }

    saveSurveyMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      questions: questions.map((q, index) => ({ ...q, order: index }))
    });
  }, [title, description, questions, saveSurveyMutation, toast]);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Survey Preview</h2>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            <X className="w-4 h-4 mr-2" />
            Close Preview
          </Button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Untitled Survey'}</h1>
              {description && <p className="text-gray-600">{description}</p>}
            </div>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <SurveyQuestionPreview key={question.id} question={question} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Survey Builder</h2>
          <Badge variant="secondary">{questions.length} Questions</Badge>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saveSurveyMutation.isPending}>
            {saveSurveyMutation.isPending ? (
              <LoadingSpinner className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Survey
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Question Types Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-medium text-gray-900 mb-4">Question Types</h3>
          <div className="space-y-2">
            {QUESTION_TYPES.map((questionType) => (
              <Button
                key={questionType.type}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => addQuestion(questionType.type)}
              >
                <div className="flex items-start space-x-3">
                  <questionType.icon className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">{questionType.label}</div>
                    <div className="text-sm text-gray-500">{questionType.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Form Canvas */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Survey Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    placeholder="Survey Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold border-none bg-transparent focus:bg-gray-50 p-2"
                  />
                  <Textarea
                    placeholder="Survey Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-none bg-transparent focus:bg-gray-50 p-2"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                    <p className="text-gray-500 mb-4">Start building your survey by adding questions from the sidebar</p>
                    <Button onClick={() => addQuestion('text')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                questions.map((question, index) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    index={index}
                    isSelected={selectedQuestionId === question.id}
                    onSelect={() => setSelectedQuestionId(question.id)}
                    onUpdate={(updates) => updateQuestion(question.id, updates)}
                    onDelete={() => deleteQuestion(question.id)}
                    onDuplicate={() => duplicateQuestion(question.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedQuestion && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">Question Settings</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text">Question Text</Label>
                <Textarea
                  id="question-text"
                  value={selectedQuestion.text}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { text: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={selectedQuestion.required}
                  onCheckedChange={(checked) => updateQuestion(selectedQuestion.id, { required: checked })}
                />
                <Label htmlFor="required">Required</Label>
              </div>
              
              {selectedQuestion.helpText !== undefined && (
                <div>
                  <Label htmlFor="help-text">Help Text</Label>
                  <Textarea
                    id="help-text"
                    value={selectedQuestion.helpText || ''}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { helpText: e.target.value })}
                    className="mt-1"
                    placeholder="Optional help text"
                    rows={2}
                  />
                </div>
              )}

              {/* Options for multiple choice and checkbox questions */}
              {(selectedQuestion.type === 'multiple-choice' || selectedQuestion.type === 'checkbox') && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {selectedQuestion.options?.map((option, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(selectedQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            updateQuestion(selectedQuestion.id, { options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newOptions = selectedQuestion.options?.filter((_, i) => i !== index) || [];
                            updateQuestion(selectedQuestion.id, { options: newOptions });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [...(selectedQuestion.options || []), `Option ${(selectedQuestion.options?.length || 0) + 1}`];
                        updateQuestion(selectedQuestion.id, { options: newOptions });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Rating scale settings */}
              {selectedQuestion.type === 'rating' && (
                <div className="space-y-3">
                  <div>
                    <Label>Scale Range</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={selectedQuestion.scale?.min || 1}
                        onChange={(e) => updateQuestion(selectedQuestion.id, {
                          scale: { 
                            ...selectedQuestion.scale,
                            min: parseInt(e.target.value) || 1,
                            max: selectedQuestion.scale?.max || 5
                          }
                        })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={selectedQuestion.scale?.max || 5}
                        onChange={(e) => updateQuestion(selectedQuestion.id, {
                          scale: { 
                            ...selectedQuestion.scale,
                            min: selectedQuestion.scale?.min || 1,
                            max: parseInt(e.target.value) || 5
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="min-label">Low Label</Label>
                    <Input
                      id="min-label"
                      value={selectedQuestion.scale?.minLabel || ''}
                      onChange={(e) => updateQuestion(selectedQuestion.id, {
                        scale: { 
                          ...selectedQuestion.scale,
                          min: selectedQuestion.scale?.min || 1,
                          max: selectedQuestion.scale?.max || 5,
                          minLabel: e.target.value
                        }
                      })}
                      placeholder="e.g., Poor"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-label">High Label</Label>
                    <Input
                      id="max-label"
                      value={selectedQuestion.scale?.maxLabel || ''}
                      onChange={(e) => updateQuestion(selectedQuestion.id, {
                        scale: { 
                          ...selectedQuestion.scale,
                          min: selectedQuestion.scale?.min || 1,
                          max: selectedQuestion.scale?.max || 5,
                          maxLabel: e.target.value
                        }
                      })}
                      placeholder="e.g., Excellent"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Survey Question Preview Component for the preview mode
interface SurveyQuestionPreviewProps {
  question: Question;
  index: number;
}

function SurveyQuestionPreview({ question, index }: SurveyQuestionPreviewProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="font-medium text-gray-900">
            {index + 1}. {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.helpText && (
            <p className="text-sm text-gray-500 mt-1">{question.helpText}</p>
          )}
        </div>
        
        <div className="space-y-3">
          {question.type === 'text' && (
            <Input placeholder="Your answer" disabled />
          )}
          
          {question.type === 'textarea' && (
            <Textarea placeholder="Your answer" disabled rows={3} />
          )}
          
          {question.type === 'email' && (
            <Input type="email" placeholder="your.email@example.com" disabled />
          )}
          
          {question.type === 'date' && (
            <Input type="date" disabled />
          )}
          
          {question.type === 'multiple-choice' && (
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <input type="radio" name={`question-${question.id}`} disabled />
                  <label className="text-gray-700">{option}</label>
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'checkbox' && (
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <input type="checkbox" disabled />
                  <label className="text-gray-700">{option}</label>
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'rating' && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {question.scale?.minLabel || question.scale?.min || 1}
              </span>
              <div className="flex space-x-2">
                {Array.from(
                  { length: (question.scale?.max || 5) - (question.scale?.min || 1) + 1 },
                  (_, i) => (question.scale?.min || 1) + i
                ).map(num => (
                  <button 
                    key={num} 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 text-sm disabled:cursor-not-allowed"
                    disabled
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {question.scale?.maxLabel || question.scale?.max || 5}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function QuestionEditor({ question, index, isSelected, onSelect, onUpdate, onDelete, onDuplicate }: QuestionEditorProps) {
  return (
    <Card 
      className={`hover:border-primary-300 transition-colors group cursor-pointer ${isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="font-medium text-gray-900 mb-1">
              Question {index + 1} • {QUESTION_TYPES.find(qt => qt.type === question.type)?.label}
            </div>
            <p className="text-sm text-gray-500">
              {question.text} {question.required && '(Required)'}
            </p>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <GripVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Quick question preview */}
        <div className="text-sm text-gray-400">
          Click to edit • {question.type === 'multiple-choice' || question.type === 'checkbox' ? `${question.options?.length || 0} options` : `${question.type} input`}
        </div>
      </CardContent>
    </Card>
  );
}