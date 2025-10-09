import { useState } from "react";
import { WelcomeScreen } from "@/components/ChatBot/WelcomeScreen";
import { NameStep } from "@/components/ChatBot/NameStep";
import { InitialChoice } from "@/components/ChatBot/InitialChoice";
import { PhotoUploadStep } from "@/components/ChatBot/PhotoUploadStep";
import { SkinTypeStep } from "@/components/ChatBot/SkinTypeStep";
import { AgeStep } from "@/components/ChatBot/AgeStep";
import { ConcernsStep } from "@/components/ChatBot/ConcernsStep";
import { ProductTypeStep, type ProductType } from "@/components/ChatBot/ProductTypeStep";
import { AdditionalInfoStep } from "@/components/ChatBot/AdditionalInfoStep";
import { EmailCollectionStep } from "@/components/ChatBot/EmailCollectionStep";
import { ResultsPage } from "@/components/ChatBot/ResultsPage";
import { ProductInfoFlow } from "@/components/ChatBot/ProductInfoFlow";
import { QuestionsFlow } from "@/components/ChatBot/QuestionsFlow";
import { SkinAnalysisResults, type SkinScores } from "@/components/ChatBot/SkinAnalysisResults";
import { ChatContainer } from "@/components/ChatBot/ChatContainer";
import { ChatMessage } from "@/components/ChatBot/ChatMessage";

type Step = 
  | "welcome"
  | "name"
  | "initial-choice"
  | "product-info"
  | "questions"
  | "photo-upload"
  | "skin-analysis"
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
  photoPreview?: string;
  skinScores?: SkinScores;
  skinType?: string;
  age?: number;
  ageDisplay?: string;
  concerns?: string[];
  productTypes?: ProductType[];
  additionalInfo?: string;
}

interface StepHistoryItem {
  step: Step;
  data: Partial<UserData>;
}

const Index = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [userData, setUserData] = useState<UserData>({});
  const [stepHistory, setStepHistory] = useState<StepHistoryItem[]>([]);

  const navigateToStep = (newStep: Step, newData: Partial<UserData> = {}) => {
    setStepHistory(prev => [...prev, { step, data: userData }]);
    setUserData(prev => ({ ...prev, ...newData }));
    setStep(newStep);
  };

  const handleBack = () => {
    if (stepHistory.length > 0) {
      const previous = stepHistory[stepHistory.length - 1];
      setStepHistory(prev => prev.slice(0, -1));
      setStep(previous.step);
      setUserData(previous.data as UserData);
    }
  };

  const handleStart = () => navigateToStep("name");

  const handleFeatureClick = (featureType: 'analysis' | 'products' | 'questions') => {
    setUserData(prev => ({ ...prev, choice: featureType }));
    navigateToStep("name");
  };

  const handleNameSubmit = (name: string) => {
    const updatedData = { name };
    
    // Se l'utente ha cliccato su una feature card, vai direttamente a quella sezione
    if (userData.choice) {
      const choice = userData.choice;
      if (choice === 'analysis') {
        navigateToStep("photo-upload", { ...updatedData, choice });
      } else if (choice === 'products') {
        navigateToStep("product-info", { ...updatedData, choice });
      } else if (choice === 'questions') {
        navigateToStep("questions", { ...updatedData, choice });
      }
    } else {
      navigateToStep("initial-choice", updatedData);
    }
  };

  const handleInitialChoice = (choice: 'analysis' | 'products' | 'questions') => {
    if (choice === 'analysis') {
      navigateToStep("photo-upload", { choice });
    } else if (choice === 'products') {
      navigateToStep("product-info", { choice });
    } else if (choice === 'questions') {
      navigateToStep("questions", { choice });
    }
  };

  const handlePhotoUpload = (photo?: File) => {
    if (photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        navigateToStep("skin-analysis", { photo, photoPreview: reader.result as string });
      };
      reader.readAsDataURL(photo);
    } else {
      navigateToStep("skin-type", { photo: undefined });
    }
  };

  const handleSkinAnalysis = (scores: SkinScores) => {
    navigateToStep("skin-type", { skinScores: scores });
  };

  const handleSkinType = (skinType: string) => {
    navigateToStep("age", { skinType });
  };

  const handleAge = (age: number, ageDisplay?: string) => {
    navigateToStep("concerns", { age, ageDisplay });
  };

  const handleConcerns = (concerns: string[]) => {
    navigateToStep("product-type", { concerns });
  };

  const handleProductType = (productTypes: ProductType[]) => {
    navigateToStep("additional-info", { productTypes });
  };

  const handleAdditionalInfo = (info?: string) => {
    navigateToStep("email-collection", { additionalInfo: info });
  };

  const handleEmailCollection = (data: { fullName: string; email: string; phone?: string }) => {
    navigateToStep("results", { 
      fullName: data.fullName,
      email: data.email,
      phone: data.phone
    });
  };

  const handleRestart = () => {
    setUserData({});
    setStep("welcome");
    setStepHistory([]);
  };

  const handleBackToChoice = () => {
    setStep("initial-choice");
  };

  const showBackButton = step !== "welcome" && step !== "results" && step !== "name";
  const useChatLayout = [
    "skin-analysis",
    "skin-type", 
    "age", 
    "concerns", 
    "product-type", 
    "additional-info", 
    "email-collection"
  ].includes(step);

  if (!useChatLayout) {
    return (
      <>
        {step === "welcome" && <WelcomeScreen onStart={handleStart} onFeatureClick={handleFeatureClick} />}
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
        {step === "results" && userData.email && userData.skinType && userData.age && (
          <ResultsPage 
            userData={userData as any} 
            onRestart={handleRestart}
          />
        )}
      </>
    );
  }

  return (
    <ChatContainer onBack={showBackButton ? handleBack : undefined} showBack={showBackButton}>
      {/* Bot greeting message */}
      <ChatMessage sender="bot">
        <p className="text-sm sm:text-base">
          Ciao <strong className="text-primary">{userData.name}</strong>! 👋 
        </p>
        <p className="text-sm sm:text-base mt-1">
          Sono il tuo assistente personale Alma. Ti guiderò passo dopo passo per trovare i prodotti perfetti per la tua pelle. 
          Rispondi con calma alle mie domande! ✨
        </p>
      </ChatMessage>

      {/* Skin Analysis */}
      {step === "skin-analysis" && (
        <ChatMessage sender="bot">
          <SkinAnalysisResults 
            photoPreview={userData.photoPreview}
            onNext={handleSkinAnalysis}
          />
        </ChatMessage>
      )}

      {/* Skin Type */}
      {step === "skin-type" && (
        <>
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base font-medium mb-1">
              Perfetto! Ora dimmi, che tipo di pelle hai? 🤔
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Questa informazione mi aiuterà a consigliarti i prodotti più adatti.
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <SkinTypeStep onNext={handleSkinType} />
          </ChatMessage>
        </>
      )}

      {/* Age */}
      {step === "age" && userData.skinType && (
        <>
          <ChatMessage sender="user">
            <p className="text-sm sm:text-base font-medium">Pelle {userData.skinType}</p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base">
              Ottima scelta! Ora, quanti anni hai? 🎂
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              L'età della pelle è importante per personalizzare al meglio la routine.
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <AgeStep onNext={handleAge} />
          </ChatMessage>
        </>
      )}

      {/* Concerns */}
      {step === "concerns" && userData.age && (
        <>
          <ChatMessage sender="user">
            <p className="text-sm sm:text-base font-medium">{userData.ageDisplay || `${userData.age} anni`}</p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base">
              Perfetto! Quali sono le tue principali preoccupazioni per la pelle? 🎯
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Puoi selezionare più opzioni - questo mi aiuterà a darti consigli mirati!
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <ConcernsStep onNext={handleConcerns} />
          </ChatMessage>
        </>
      )}

      {/* Product Type */}
      {step === "product-type" && userData.concerns && (
        <>
          <ChatMessage sender="user">
            <p className="text-sm sm:text-base">{userData.concerns.join(", ")}</p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base">
              Benissimo! Che tipo di prodotti ti interessano? 🛍️
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Ti consiglio la routine completa, ma puoi anche scegliere prodotti specifici!
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <ProductTypeStep onNext={handleProductType} />
          </ChatMessage>
        </>
      )}

      {/* Additional Info */}
      {step === "additional-info" && userData.productTypes && (
        <>
          <ChatMessage sender="user">
            <p className="text-sm sm:text-base">
              {userData.productTypes.length === 1 && userData.productTypes[0] === "routine_completa" 
                ? "✨ Routine Completa" 
                : `${userData.productTypes.length} prodotti selezionati`}
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base">
              Fantastico! C'è qualcos'altro che vorresti dirmi sulla tua pelle o sulle tue esigenze? 💬
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Ad esempio: allergie, prodotti che ami o che eviti, obiettivi specifici...
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <AdditionalInfoStep onNext={handleAdditionalInfo} />
          </ChatMessage>
        </>
      )}

      {/* Email Collection */}
      {step === "email-collection" && (
        <>
          {userData.additionalInfo && (
            <ChatMessage sender="user">
              <p className="text-sm sm:text-base">{userData.additionalInfo}</p>
            </ChatMessage>
          )}
          <ChatMessage sender="bot">
            <p className="text-sm sm:text-base">
              Perfetto! Ora ho tutto quello che mi serve! 🎉
            </p>
            <p className="text-sm sm:text-base mt-2">
              Per inviarti i risultati e uno <strong className="text-primary">sconto esclusivo del 15%</strong>, 
              ho bisogno dei tuoi dati di contatto. 📧
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <EmailCollectionStep onNext={handleEmailCollection} />
          </ChatMessage>
        </>
      )}
    </ChatContainer>
  );
};

export default Index;