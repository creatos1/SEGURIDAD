import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useTour } from "@/hooks/use-tour";
import { HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetTour() {
  const { resetTour, tourType } = useTour();
  const { toast } = useToast();

  // Map tour type to friendly name
  const getTourTypeName = () => {
    switch (tourType) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'User';
      case 'driver':
        return 'Driver';
      default:
        return '';
    }
  };

  const handleResetTour = () => {
    resetTour();
    toast({
      title: "Tutorial Reset",
      description: `The ${getTourTypeName()} tutorial has been reset and will be shown on your next page load.`,
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Application Tour
        </CardTitle>
        <CardDescription>
          Reset the interactive tour to learn about the application features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          If you want to see the application tour again, you can reset it here. 
          The tour will be shown the next time you navigate to the dashboard.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleResetTour}>
          Show Tour Again
        </Button>
      </CardFooter>
    </Card>
  );
}