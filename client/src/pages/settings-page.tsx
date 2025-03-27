import { useState } from "react";
import Header from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResetTour from "@/components/settings/reset-tour";
import { useAuth } from "@/hooks/use-auth";
import { Settings, User, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState("account");
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Header 
        title="Settings" 
        subtitle="Manage your account and application preferences"
        className="mb-6"
      />
      
      <Tabs defaultValue="account" value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Application</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Username</p>
                  <p className="text-sm text-muted-foreground">{user?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Full Name</p>
                  <p className="text-sm text-muted-foreground">{user?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Role</p>
                  <div className="flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      user?.role === 'admin' ? 'bg-blue-500' : 
                      user?.role === 'driver' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></span>
                    <p className="text-sm text-muted-foreground capitalize">{user?.role || 'user'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="application" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResetTour />
            
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Help & Support
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Need help or have a question about TransitPro? Contact our support team or check out the documentation.
              </p>
              <div className="flex flex-col space-y-2">
                <a 
                  href="mailto:support@transitpro.com" 
                  className="text-sm text-primary hover:underline"
                >
                  Contact Support
                </a>
                <a 
                  href="#" 
                  className="text-sm text-primary hover:underline"
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}