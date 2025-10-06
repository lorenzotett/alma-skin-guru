import { useState } from "react";
import { WelcomeScreen } from "@/components/ChatBot/WelcomeScreen";
import { NameStep } from "@/components/ChatBot/NameStep";
import { InitialChoice } from "@/components/ChatBot/InitialChoice";
import { PhotoUploadStep } from "@/components/ChatBot/PhotoUploadStep";
import { SkinTypeStep } from "@/components/ChatBot/SkinTypeStep";
import { AgeStep } from "@/components/ChatBot/AgeStep";
import { ConcernsStep } from "@/components/ChatBot/ConcernsStep";

type Step = 
  | "welcome"
  | "name"
  | "initial-choice"
  | "photo-upload"
  | "skin-type"
  | "age"
  | "concerns"
  | "product-type"
  | "additional-info"
  | "email-collection"
  | "results";

type SkinType = "secca" | "grassa" | "mista" | "normale" | "asfittica";
type Concern = string;

interface UserData {
  name?: string;
  choice?: 'analysis' | 'products' | 'questions';
  photo?: File;
  skinType?: SkinType;
  age?: number;
  concerns?: Concern[];
}

const Index = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [userData, setUserData] = useState<UserData>({});

  const handleStart = () => {
    setStep("name");
  };

  const handleNameSubmit = (name: string) => {
    setUserData(prev => ({ ...prev, name }));
    setStep("initial-choice");
  };

  const handleInitialChoice = (choice: 'analysis' | 'products' | 'questions') => {
    setUserData(prev => ({ ...prev, choice }));
    if (choice === 'analysis') {
      setStep("photo-upload");
    } else {
      // TODO: Handle other choices
      alert(`Funzionalità "${choice}" in sviluppo`);
    }
  };

  const handlePhotoUpload = (photo?: File) => {
    setUserData(prev => ({ ...prev, photo }));
    setStep("skin-type");
  };

  const handleSkinType = (skinType: SkinType) => {
    setUserData(prev => ({ ...prev, skinType }));
    setStep("age");
  };

  const handleAge = (age: number) => {
    setUserData(prev => ({ ...prev, age }));
    setStep("concerns");
  };

  const handleConcerns = (concerns: Concern[]) => {
    setUserData(prev => ({ ...prev, concerns }));
    // TODO: Continue to next steps
    alert("Dati raccolti! Prossimi step in sviluppo...");
    console.log("User Data:", { ...userData, concerns });
  };

  return (
    <>
      {step === "welcome" && <WelcomeScreen onStart={handleStart} />}
      {step === "name" && <NameStep onNext={handleNameSubmit} />}
      {step === "initial-choice" && userData.name && (
        <InitialChoice userName={userData.name} onChoice={handleInitialChoice} />
      )}
      {step === "photo-upload" && <PhotoUploadStep onNext={handlePhotoUpload} />}
      {step === "skin-type" && <SkinTypeStep onNext={handleSkinType} />}
      {step === "age" && <AgeStep onNext={handleAge} />}
      {step === "concerns" && <ConcernsStep onNext={handleConcerns} />}
    </>
  );
};

export default Index;