import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

type TourKeys = 'admin' | 'user' | 'driver';

interface TourState {
  seen: Record<TourKeys, boolean>;
}

interface TourContextType {
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  markTourAsCompleted: () => void;
  resetTour: () => void;
  tourType: TourKeys | null;
}

const TourContext = createContext<TourContextType | null>(null);

const LOCAL_STORAGE_KEY = 'transit-pro-tour-state';

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [tourState, setTourState] = useState<TourState>({
    seen: {
      admin: false,
      user: false,
      driver: false
    }
  });

  // Determine which tour to show based on the user's role
  const tourType: TourKeys | null = user?.role === 'admin' 
    ? 'admin' 
    : user?.role === 'user' 
      ? 'user' 
      : user?.role === 'driver' 
        ? 'driver' 
        : null;

  // Load the tour state from local storage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setTourState(parsedState);
      } catch (e) {
        console.error('Error parsing tour state from localStorage', e);
      }
    }
  }, []);

  // When user logs in, check if they should see the tour
  useEffect(() => {
    if (user && tourType && !tourState.seen[tourType]) {
      // Show tour if the user hasn't seen it yet
      setShowTour(true);
    } else {
      setShowTour(false);
    }
  }, [user, tourType, tourState]);

  // Save the tour state to local storage when it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tourState));
  }, [tourState]);

  const markTourAsCompleted = () => {
    if (!tourType) return;
    
    setTourState(prev => ({
      ...prev,
      seen: {
        ...prev.seen,
        [tourType]: true
      }
    }));
    setShowTour(false);
  };

  const resetTour = () => {
    if (!tourType) return;
    
    setTourState(prev => ({
      ...prev,
      seen: {
        ...prev.seen,
        [tourType]: false
      }
    }));
    setShowTour(true);
  };

  return (
    <TourContext.Provider 
      value={{ 
        showTour, 
        setShowTour, 
        markTourAsCompleted, 
        resetTour,
        tourType
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};