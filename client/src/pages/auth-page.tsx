import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Bus, User, Shield, LogIn, UserPlus } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [_, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      fullName: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      email: data.email,
      username: data.username,
      password: data.password,
      fullName: data.fullName || undefined,
      role: "user", // Default role for new registrations
    });
  };

  // Demo login functions
  const setDemoLogin = (role: 'admin' | 'user' | 'driver') => {
    switch(role) {
      case 'admin':
        loginForm.setValue('email', 'admin@transitpro.com');
        loginForm.setValue('password', 'admin123');
        break;
      case 'user':
        loginForm.setValue('email', 'user@example.com');
        loginForm.setValue('password', 'user123');
        break;
      case 'driver':
        loginForm.setValue('email', 'driver@transitpro.com');
        loginForm.setValue('password', 'driver123');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login/Register Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">TransitPro</CardTitle>
            <CardDescription className="text-neutral-300">
              Transit Management System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="email@example.com" 
                              type="email" 
                              {...field} 
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              {...field} 
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormLabel className="text-sm text-neutral-300 cursor-pointer">
                              Remember me
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="link" size="sm" className="text-primary">
                        Forgot password?
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary text-white uppercase font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      <LogIn className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="email@example.com" 
                              type="email" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="johndoe" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              {...field} 
                              disabled={registerMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary text-white uppercase font-medium"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      <UserPlus className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center">
              <p className="text-sm text-neutral-300 mb-2">Demo login credentials</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <Button 
                  onClick={() => setDemoLogin('admin')} 
                  className="py-1 px-2 bg-[#3f51b5] text-white rounded flex items-center justify-center"
                >
                  <Shield className="mr-1 h-4 w-4" />
                  Admin
                </Button>
                <Button 
                  onClick={() => setDemoLogin('user')} 
                  className="py-1 px-2 bg-[#4caf50] text-white rounded flex items-center justify-center"
                >
                  <User className="mr-1 h-4 w-4" />
                  User
                </Button>
                <Button 
                  onClick={() => setDemoLogin('driver')} 
                  className="py-1 px-2 bg-[#ff9800] text-white rounded flex items-center justify-center"
                >
                  <Bus className="mr-1 h-4 w-4" />
                  Driver
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Hero Section */}
        <Card className="w-full bg-gradient-to-br from-primary/90 to-primary hidden md:block">
          <CardContent className="flex flex-col justify-center h-full p-6 text-white">
            <h2 className="text-3xl font-bold mb-4">Welcome to TransitPro</h2>
            <p className="text-lg mb-6">
              The complete transportation management system for modern transit operations.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Shield className="mr-2 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Administrators</h3>
                  <p className="text-sm opacity-80">Create routes, manage drivers, and monitor your entire fleet in real-time.</p>
                </div>
              </li>
              <li className="flex items-start">
                <User className="mr-2 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Passengers</h3>
                  <p className="text-sm opacity-80">Track routes in real-time, rate your experience, and stay informed about your journey.</p>
                </div>
              </li>
              <li className="flex items-start">
                <Bus className="mr-2 h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Drivers</h3>
                  <p className="text-sm opacity-80">Follow assigned routes, access vehicle information, and maintain communication with dispatch.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
