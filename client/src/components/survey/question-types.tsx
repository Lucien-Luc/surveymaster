import { QuestionType } from "@shared/schema";
import { 
  AlignLeft, 
  AlignJustify, 
  List, 
  CheckSquare, 
  Star, 
  Calendar, 
  Mail,
  GripVertical
} from "lucide-react";

interface QuestionTypeItemProps {
  type: QuestionType;
  onSelect: (type: QuestionType) => void;
  draggable?: boolean;
}

interface QuestionTypeConfig {
  icon: typeof AlignLeft;
  title: string;
  description: string;
}

export const questionTypeConfigs: Record<QuestionType, QuestionTypeConfig> = {
  text: {
    icon: AlignLeft,
    title: "Text Input",
    description: "Single line text"
  },
  textarea: {
    icon: AlignJustify,
    title: "Text Area", 
    description: "Multi-line text"
  },
  'multiple-choice': {
    icon: List,
    title: "Multiple Choice",
    description: "Select one option"
  },
  checkbox: {
    icon: CheckSquare,
    title: "Checkbox",
    description: "Select multiple"
  },
  rating: {
    icon: Star,
    title: "Rating Scale",
    description: "1-5 or 1-10 scale"
  },
  date: {
    icon: Calendar,
    title: "Date Picker",
    description: "Select date"
  },
  email: {
    icon: Mail,
    title: "Email Input",
    description: "Validated email"
  }
};

export function QuestionTypeItem({ type, onSelect, draggable = false }: QuestionTypeItemProps) {
  const config = questionTypeConfigs[type];
  const Icon = config.icon;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div 
      className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors duration-200 group"
      onClick={() => onSelect(type)}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-gray-500" />
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900">{config.title}</p>
          <p className="text-xs text-gray-600">{config.description}</p>
        </div>
        {draggable && (
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}

interface QuestionTypesSidebarProps {
  onSelectType: (type: QuestionType) => void;
}

export function QuestionTypesSidebar({ onSelectType }: QuestionTypesSidebarProps) {
  const questionTypes: QuestionType[] = [
    'text', 'textarea', 'multiple-choice', 'checkbox', 'rating', 'date', 'email'
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-medium text-gray-900 mb-4">Question Types</h3>
      <div className="space-y-2">
        {questionTypes.map((type) => (
          <QuestionTypeItem 
            key={type} 
            type={type} 
            onSelect={onSelectType}
            draggable
          />
        ))}
      </div>
    </div>
  );
}
