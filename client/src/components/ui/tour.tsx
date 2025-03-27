import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, LucideIcon } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  content: React.ReactNode;
  icon?: LucideIcon;
  position?: "left" | "right" | "top" | "bottom";
}

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function Tour({ steps, isOpen, onClose, onComplete }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [cardPosition, setCardPosition] = useState<"left" | "right" | "top" | "bottom">("bottom");

  const calculatePosition = (target: string) => {
    const element = document.querySelector(target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const top = rect.top + scrollTop;
    const left = rect.left + scrollLeft;

    setPosition({
      top,
      left,
      width: rect.width,
      height: rect.height,
    });

    // Determine best position for the card
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const pos = steps[currentStep].position || "bottom";

    // Override if specified in step
    if (pos) {
      setCardPosition(pos);
      return;
    }

    // Automatic positioning logic
    if (rect.top > windowHeight / 2) {
      setCardPosition("top");
    } else {
      setCardPosition("bottom");
    }

    if (rect.left < windowWidth / 3) {
      setCardPosition("right");
    } else if (rect.left > (windowWidth * 2) / 3) {
      setCardPosition("left");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculatePosition(steps[currentStep].target);
    };

    calculatePosition(steps[currentStep].target);
    window.addEventListener("resize", handleResize);

    // Highlight the element
    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      targetElement.classList.add("tour-highlight");
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      
      // Remove highlight
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        targetElement.classList.remove("tour-highlight");
      }
    };
  }, [currentStep, isOpen, steps]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      // Remove highlight from current element
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        targetElement.classList.remove("tour-highlight");
      }
      
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Remove highlight from current element
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        targetElement.classList.remove("tour-highlight");
      }
      
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    // Remove highlight from current element
    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      targetElement.classList.remove("tour-highlight");
    }
    
    onComplete();
  };

  // Calculate the card position
  const getCardStyle = () => {
    const gap = 16; // Gap between element and card
    
    switch (cardPosition) {
      case "top":
        return {
          top: position.top - gap,
          left: position.left + position.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case "right":
        return {
          top: position.top + position.height / 2,
          left: position.left + position.width + gap,
          transform: 'translateY(-50%)'
        };
      case "left":
        return {
          top: position.top + position.height / 2,
          left: position.left - gap,
          transform: 'translate(-100%, -50%)'
        };
      case "bottom":
      default:
        return {
          top: position.top + position.height + gap,
          left: position.left + position.width / 2,
          transform: 'translateX(-50%)'
        };
    }
  };

  // Get the current step
  const step = steps[currentStep];
  const Icon = step.icon;

  // Calculate the pointer style (small triangle pointing to the element)
  const getPointerStyle = () => {
    switch (cardPosition) {
      case "top":
        return {
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
        };
      case "right":
        return {
          left: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
        };
      case "left":
        return {
          right: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
        };
      case "bottom":
      default:
        return {
          top: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center pointer-events-none">
      {/* Overlay element to allow clicking to skip the tour if needed */}
      <div className="absolute inset-0 cursor-pointer pointer-events-auto" onClick={handleSkip} />

      {/* The highlighted element overlay */}
      <div
        className="absolute border-2 border-primary rounded animate-pulse pointer-events-none"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Tour card */}
      <Card
        className="absolute bg-card shadow-lg w-80 pointer-events-auto z-[1001] max-w-[90vw]"
        style={getCardStyle()}
      >
        {/* Pointer/Arrow */}
        <div
          className="absolute w-4 h-4 bg-card transform"
          style={getPointerStyle()}
        />
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {Icon && <Icon className="w-5 h-5 mr-2 text-primary" />}
              <h3 className="font-semibold text-lg">{step.title}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">{step.content}</div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <div className="flex">
                {currentStep > 0 && (
                  <Button variant="outline" size="icon" onClick={handlePrevious} className="mr-1">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  {currentStep !== steps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}