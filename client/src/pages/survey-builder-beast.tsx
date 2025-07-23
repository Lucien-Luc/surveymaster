import { SurveyBuilder } from "@/components/survey/survey-builder";

export default function SurveyBuilderPage() {
  return (
    <SurveyBuilder 
      onSave={(savedSurvey) => {
        console.log('Survey saved:', savedSurvey);
        alert('Survey saved successfully! Check browser console for details.');
      }}
      onClose={() => {
        window.location.href = '/';
      }}
    />
  );
}