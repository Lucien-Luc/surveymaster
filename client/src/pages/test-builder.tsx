import { SurveyBuilder } from "@/components/survey/survey-builder";

export default function TestBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      <SurveyBuilder 
        onSave={(savedSurvey) => {
          console.log('Survey saved:', savedSurvey);
          alert('Survey saved successfully!');
        }}
        onClose={() => {
          console.log('Survey builder closed');
          window.location.href = '/';
        }}
      />
    </div>
  );
}