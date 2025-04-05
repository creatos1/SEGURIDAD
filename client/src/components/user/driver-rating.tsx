import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, User } from "lucide-react";

// Form schema for rating
const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RatingFormValues = z.infer<typeof ratingFormSchema>;

type DriverRatingProps = {
  driverId: number;
  driverName: string;
  routeName?: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function DriverRating({ 
  driverId, 
  driverName, 
  routeName = "Unknown Route", 
  isOpen, 
  onClose 
}: DriverRatingProps) {
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);
  
  // Rating form
  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async (data: RatingFormValues) => {
      const res = await apiRequest(
        "POST", 
        "/api/driver-ratings", 
        {
          driverId,
          rating: data.rating,
          comment: data.comment,
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/driver-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-ratings/average', driverId] });
      
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: RatingFormValues) => {
    submitRatingMutation.mutate(data);
  };

  // Handle star click
  const handleStarClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  // Check if the form is valid
  const isValid = form.watch("rating") >= 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Driver</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-neutral-200 flex items-center justify-center mx-auto">
              <User className="h-10 w-10 text-neutral-400" />
            </div>
            <h4 className="font-medium text-neutral-400 mt-3">{driverName}</h4>
            <p className="text-sm text-neutral-300">{routeName}</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <p className="text-center text-neutral-400 mb-3">How was your experience?</p>
                
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            className="text-2xl focus:outline-none transition-colors"
                            onMouseEnter={() => setHoverRating(rating)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleStarClick(rating)}
                          >
                            <Star 
                              className={`h-8 w-8 ${
                                (hoverRating || field.value) >= rating 
                                  ? 'text-[#ff9800] fill-[#ff9800]' 
                                  : 'text-neutral-200'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your experience..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isValid || submitRatingMutation.isPending}
                  className="bg-[#4caf50] hover:bg-[#43a047] text-white"
                >
                  {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
