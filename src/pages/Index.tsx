import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Scroll to top when navigating to any step
    window.scrollTo({ top: 0, behavior: 'instant' });
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

  const handleSkinType = (skinTypes: string[]) => {
    // Join multiple skin types for display
    const skinType = skinTypes.join(", ");
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

  const handleEmailCollection = async (data: { fullName: string; email: string; phone?: string }) => {
    try {
      // Salva i dati nel database
      const { error } = await supabase.from('contacts').insert({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        skin_type: userData.skinType,
        concerns: userData.concerns,
        age: userData.age,
        product_type: userData.productTypes?.join(', '),
        additional_info: userData.additionalInfo,
        photo_url: userData.photoPreview,
      });

      if (error) {
        console.error('Errore nel salvataggio dei dati:', error);
        toast.error('Errore nel salvataggio dei dati. Riprova.');
        return;
      }

      toast.success('Dati salvati con successo!');
      
      navigateToStep("results", { 
        fullName: data.fullName,
        email: data.email,
        phone: data.phone
      });
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Si è verificato un errore. Riprova.');
    }
  };

  const handleRestart = () => {
    setUserData({});
    setStep("welcome");
    setStepHistory([]);
  };
  
  const handleBackToWelcome = () => {
    setUserData({});
    setStep("welcome");
    setStepHistory([]);
  };

  const handleBackToName = () => {
    setStep("name");
  };

  const handleBackToChoice = () => {
    setStep("initial-choice");
  };

  const showBackButton = step !== "welcome" && step !== "results";
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
        {step === "name" && <NameStep onNext={handleNameSubmit} onBack={handleBack} />}
        {step === "initial-choice" && userData.name && (
          <InitialChoice userName={userData.name} onChoice={handleInitialChoice} onBack={handleBack} />
        )}
        {step === "product-info" && userData.name && (
          <ProductInfoFlow userName={userData.name} onBack={handleBack} />
        )}
        {step === "questions" && userData.name && (
          <QuestionsFlow userName={userData.name} onBack={handleBack} />
        )}
        {step === "photo-upload" && <PhotoUploadStep onNext={handlePhotoUpload} onBack={handleBack} />}
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
          {userData.photoPreview && (
            <ChatMessage sender="user">
              <div className="space-y-2">
                <img src={userData.photoPreview} alt="Foto analisi" className="max-w-[200px] rounded-lg" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigateToStep("photo-upload", {})}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  ✏️ Cambia foto
                </Button>
              </div>
            </ChatMessage>
          )}
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
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium">Pelle {userData.skinType}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateToStep("skin-type", {})}
                className="text-xs text-primary hover:text-primary/80"
              >
                ✏️ Modifica tipo di pelle
              </Button>
            </div>
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
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium">{userData.ageDisplay || `${userData.age} anni`}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateToStep("age", { skinType: userData.skinType })}
                className="text-xs text-primary hover:text-primary/80"
              >
                ✏️ Modifica età
              </Button>
            </div>
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
            <div className="space-y-2">
              <p className="text-sm sm:text-base">{userData.concerns.join(", ")}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateToStep("concerns", { skinType: userData.skinType, age: userData.age, ageDisplay: userData.ageDisplay })}
                className="text-xs text-primary hover:text-primary/80"
              >
                ✏️ Modifica preoccupazioni
              </Button>
            </div>
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
            <div className="space-y-2">
              <p className="text-sm sm:text-base">
                {userData.productTypes.length === 1 && userData.productTypes[0] === "routine_completa" 
                  ? "✨ Routine Completa" 
                  : `${userData.productTypes.length} prodotti selezionati`}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateToStep("product-type", { skinType: userData.skinType, age: userData.age, ageDisplay: userData.ageDisplay, concerns: userData.concerns })}
                className="text-xs text-primary hover:text-primary/80"
              >
                ✏️ Modifica selezione prodotti
              </Button>
            </div>
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
              Per visualizzare i risultati personalizzati, ho bisogno dei tuoi dati di contatto. 📋
            </p>
          </ChatMessage>
          <ChatMessage sender="bot">
            <EmailCollectionStep onNext={handleEmailCollection} onBack={handleBack} />
          </ChatMessage>
        </>
      )}
    </ChatContainer>
  );
};

export default Index;