import { useState } from "react";
import { WelcomeScreen } from "@/components/ChatBot/WelcomeScreen";
import { NameStep } from "@/components/ChatBot/NameStep";
import { InitialChoice } from "@/components/ChatBot/InitialChoice";
import { PhotoUploadStep } from "@/components/ChatBot/PhotoUploadStep";
import { SkinTypeStep } from "@/components/ChatBot/SkinTypeStep";
import { AgeStep } from "@/components/ChatBot/AgeStep";
import { ConcernsStep } from "@/components/ChatBot/ConcernsStep";
import { ProductTypeStep } from "@/components/ChatBot/ProductTypeStep";
import { AdditionalInfoStep } from "@/components/ChatBot/AdditionalInfoStep";
import { EmailCollectionStep } from "@/components/ChatBot/EmailCollectionStep";
import { ResultsPage } from "@/components/ChatBot/ResultsPage";
import { ProductInfoFlow } from "@/components/ChatBot/ProductInfoFlow";
import { QuestionsFlow } from "@/components/ChatBot/QuestionsFlow";

type Step = 
  | "welcome"
  | "name"
  | "initial-choice"
  | "product-info"
  | "questions"
  | "photo-upload"
  | "skin-type"
  | "age"
  | "concerns"
  | "product-type"
  | "additional-info"
  | "email-collection"
  | "results";

interface UserData {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  choice?: 'analysis' | 'products' | 'questions';
  photo?: File;
  skinType?: string;
  age?: number;
  concerns?: string[];
  productType?: string;
  additionalInfo?: string;
}

const Index = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [userData, setUserData] = useState<UserData>({});

  const handleStart = () => setStep("name");

  const handleNameSubmit = (name: string) => {
    setUserData(prev => ({ ...prev, name }));
    setStep("initial-choice");
  };

  const handleInitialChoice = (choice: 'analysis' | 'products' | 'questions') => {
    setUserData(prev => ({ ...prev, choice }));
    if (choice === 'analysis') {
      setStep("photo-upload");
    } else if (choice === 'products') {
      setStep("product-info");
    } else if (choice === 'questions') {
      setStep("questions");
    }
  };

  const handlePhotoUpload = (photo?: File) => {
    setUserData(prev => ({ ...prev, photo }));
    setStep("skin-type");
  };

  const handleSkinType = (skinType: string) => {
    setUserData(prev => ({ ...prev, skinType }));
    setStep("age");
  };

  const handleAge = (age: number) => {
    setUserData(prev => ({ ...prev, age }));
    setStep("concerns");
  };

  const handleConcerns = (concerns: string[]) => {
    setUserData(prev => ({ ...prev, concerns }));
    setStep("product-type");
  };

  const handleProductType = (productType: string) => {
    setUserData(prev => ({ ...prev, productType }));
    setStep("additional-info");
  };

  const handleAdditionalInfo = (info?: string) => {
    setUserData(prev => ({ ...prev, additionalInfo: info }));
    setStep("email-collection");
  };

  const handleEmailCollection = (data: { fullName: string; email: string; phone?: string }) => {
    setUserData(prev => ({ 
      ...prev, 
      fullName: data.fullName,
      email: data.email,
      phone: data.phone
    }));
    setStep("results");
  };

  const handleRestart = () => {
    setUserData({});
    setStep("welcome");
  };

  const handleBackToChoice = () => {
    setStep("initial-choice");
  };

  return (
    <>
      {step === "welcome" && <WelcomeScreen onStart={handleStart} />}
      {step === "name" && <NameStep onNext={handleNameSubmit} />}
      {step === "initial-choice" && userData.name && (
        <InitialChoice userName={userData.name} onChoice={handleInitialChoice} />
      )}
      {step === "product-info" && userData.name && (
        <ProductInfoFlow userName={userData.name} onBack={handleBackToChoice} />
      )}
      {step === "questions" && userData.name && (
        <QuestionsFlow userName={userData.name} onBack={handleBackToChoice} />
      )}
      {step === "photo-upload" && <PhotoUploadStep onNext={handlePhotoUpload} />}
      {step === "skin-type" && <SkinTypeStep onNext={handleSkinType} />}
      {step === "age" && <AgeStep onNext={handleAge} />}
      {step === "concerns" && <ConcernsStep onNext={handleConcerns} />}
      {step === "product-type" && <ProductTypeStep onNext={handleProductType} />}
      {step === "additional-info" && <AdditionalInfoStep onNext={handleAdditionalInfo} />}
      {step === "email-collection" && <EmailCollectionStep onNext={handleEmailCollection} />}
      {step === "results" && userData.email && userData.skinType && userData.age && (
        <ResultsPage 
          userData={userData as any} 
          onRestart={handleRestart}
        />
      )}
    </>
  );
};

export default Index;