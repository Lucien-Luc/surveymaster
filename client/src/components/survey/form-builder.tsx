import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionTypesSidebar } from "./question-types";
import { SurveyPreview } from "./survey-preview";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Question, QuestionType, Survey, InsertSurvey } from "@shared/schema";
import { Eye, Save, X, Edit3, Copy, Trash2, GripVertical } from "lucide-react";
import { nanoid } from "nanoid";

interface FormBuilderProps {
  survey?: Survey;
  onSave?: (survey: Survey) => void;
  onClose?: () => void;
}

export function FormBuilder({ survey, onSave, onClose }: FormBuilderProps) {
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
      
      const timestamp = serverTimestamp();
      
      if (survey?.id) {
        // Update existing survey
        const surveyRef = doc(db, 'surveys', survey.id);
        await updateDoc(surveyRef, {
          ...surveyData,
          updatedAt: timestamp
        });
        return { ...survey, ...surveyData };
      } else {
        // Create new survey
        const surveysRef = collection(db, 'surveys');
        const newSurvey = {
          ...surveyData,
          createdBy: user.uid,
          createdAt: timestamp,
          updatedAt: timestamp,
          status: 'draft' as const,
          responseCount: 0
        };
        const docRef = await addDoc(surveysRef, newSurvey);
        return { id: docRef.id, ...newSurvey };
      }
    },
    onSuccess: (savedSurvey) => {
      toast({
        title: "Survey saved",
        description: "Your survey has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      onSave?.(savedSurvey as Survey);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save survey. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a survey title.",
        variant: "destructive"
      });
      return;
    }

    saveSurveyMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      questions
    });
  }, [title, description, questions, saveSurveyMutation, toast]);

  const addQuestion = useCallback((type: QuestionType) => {
    const newQuestion: Question = {
      id: nanoid(),
      type,
      text: `New ${type} question`,
      required: false,
      order: questions.length + 1
    };

    if (type === 'multiple-choice' || type === 'checkbox') {
      newQuestion.options = ['Option 1', 'Option 2', 'Option 3'];
    } else if (type === 'rating') {
      newQuestion.scale = { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' };
    }

    setQuestions(prev => [...prev, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
  }, [questions.length]);

  const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setSelectedQuestionId(null);
  }, []);

  const duplicateQuestion = useCallback((questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const duplicated = { 
        ...question, 
        id: nanoid(), 
        text: `${question.text} (Copy)`,
        order: questions.length + 1
      };
      setQuestions(prev => [...prev, duplicated]);
    }
  }, [questions]);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  if (showPreview) {
    return (
      <SurveyPreview
        survey={{ title, description, questions } as Survey}
        onClose={() => setShowPreview(false)}
        onEdit={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Survey Builder</h2>
          <p className="text-gray-600 text-sm mt-1">Create and customize your survey questions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(true)}
            disabled={questions.length === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveSurveyMutation.isPending}
          >
            {saveSurveyMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Question Types Sidebar */}
        <QuestionTypesSidebar onSelectType={addQuestion} />

        {/* Form Canvas */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Survey Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <Input
                  placeholder="Survey Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none bg-transparent placeholder-gray-500 focus:outline-none p-0 mb-4"
                />
                <Textarea
                  placeholder="Survey Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-gray-600 border-none bg-transparent placeholder-gray-500 resize-none focus:outline-none p-0"
                  rows={2}
                />
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((question, index) => (
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
              ))}

              {/* Drop Zone */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">+</span>
                    </div>
                    <p>Drag a question type here or select from the sidebar</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedQuestion && (
          <QuestionPropertiesPanel
            question={selectedQuestion}
            onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
          />
        )}
      </div>
    </div>
  );
}

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
      className={`hover:border-primary-300 transition-colors group ${isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Input
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="font-medium text-gray-900 border-none bg-transparent focus:bg-gray-50 p-2"
              placeholder="Question text"
            />
            <p className="text-sm text-gray-500 mt-1 px-2">
              Question {index + 1} • {question.required ? 'Required' : 'Optional'}
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
        
        {/* Question Preview */}
        <QuestionPreview question={question} />
      </CardContent>
    </Card>
  );
}

interface QuestionPreviewProps {
  question: Question;
}

function QuestionPreview({ question }: QuestionPreviewProps) {
  switch (question.type) {
    case 'text':
    case 'email':
      return <Input placeholder="Answer will appear here" disabled />;
    
    case 'textarea':
      return <Textarea placeholder="Answer will appear here" disabled rows={3} />;
    
    case 'multiple-choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input type="radio" disabled className="w-4 h-4" />
              <span className="text-gray-700">{option}</span>
            </div>
          ))}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input type="checkbox" disabled className="w-4 h-4" />
              <span className="text-gray-700">{option}</span>
            </div>
          ))}
        </div>
      );
    
    case 'rating':
      const scale = question.scale || { min: 1, max: 5 };
      return (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">{scale.minLabel || scale.min}</span>
          <div className="flex space-x-2">
            {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map(num => (
              <button key={num} className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-primary-500 transition-colors flex items-center justify-center text-sm">
                {num}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-600">{scale.maxLabel || scale.max}</span>
        </div>
      );
    
    case 'date':
      return <Input type="date" disabled />;
    
    default:
      return <div className="text-gray-400">Question preview</div>;
  }
}

interface QuestionPropertiesPanelProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}

function QuestionPropertiesPanel({ question, onUpdate }: QuestionPropertiesPanelProps) {
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-medium text-gray-900 mb-4">Question Properties</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
          <Textarea
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={3}
          />
        </div>
        
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Required</span>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Help Text</label>
          <Textarea
            value={question.helpText || ''}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            placeholder="Optional help text for respondents"
            rows={2}
          />
        </div>

        {/* Type-specific options */}
        {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdate({ options: newOptions });
                  }}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                  onUpdate({ options: newOptions });
                }}
              >
                Add Option
              </Button>
            </div>
          </div>
        )}

        {question.type === 'rating' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scale Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={question.scale?.min || 1}
                  onChange={(e) => onUpdate({
                    scale: { 
                      min: parseInt(e.target.value) || 1,
                      max: question.scale?.max || 5,
                      minLabel: question.scale?.minLabel,
                      maxLabel: question.scale?.maxLabel
                    }
                  })}
                  placeholder="Min"
                />
                <Input
                  type="number"
                  value={question.scale?.max || 5}
                  onChange={(e) => onUpdate({
                    scale: { 
                      min: question.scale?.min || 1,
                      max: parseInt(e.target.value) || 5,
                      minLabel: question.scale?.minLabel,
                      maxLabel: question.scale?.maxLabel
                    }
                  })}
                  placeholder="Max"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Low Label</label>
              <Input
                value={question.scale?.minLabel || ''}
                onChange={(e) => onUpdate({
                  scale: { 
                    min: question.scale?.min || 1,
                    max: question.scale?.max || 5,
                    minLabel: e.target.value,
                    maxLabel: question.scale?.maxLabel
                  }
                })}
                placeholder="e.g., Poor, Disagree"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High Label</label>
              <Input
                value={question.scale?.maxLabel || ''}
                onChange={(e) => onUpdate({
                  scale: { 
                    min: question.scale?.min || 1,
                    max: question.scale?.max || 5,
                    minLabel: question.scale?.minLabel,
                    maxLabel: e.target.value
                  }
                })}
                placeholder="e.g., Excellent, Agree"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
