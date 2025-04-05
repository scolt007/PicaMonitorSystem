import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  passwordConfirm: z.string().min(6, "Confirm password is required"),
  name: z.string().min(2, "Name is required"),
  signupCode: z.string().optional(),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user, login, register, isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && user) {
    navigate("/dashboard");
    return null;
  }

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      name: "",
      signupCode: "",
      organizationName: "",
    },
  });

  // Handle login submit
  const onLoginSubmit = (data: LoginFormValues) => {
    login.mutate(data);
  };

  // Handle register submit
  const onRegisterSubmit = (data: RegisterFormValues) => {
    register.mutate({
      username: data.username,
      password: data.password,
      name: data.name,
      email: `${data.username}@picamonitor.com`, // Generate generic email
      signupCode: data.signupCode,
      organizationName: data.organizationName,
      role: "user", // Default role for new registrations
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Left side - Auth form */}
      <div className="flex flex-col justify-center w-full max-w-md p-8 md:w-1/2 lg:w-2/5">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">PICA Monitor</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your PICA tasks</p>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="username" className="text-sm font-medium">Username</label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">Password</label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={login.isPending}>
                      {login.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline"
                  >
                    Register
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Enter your details to create a new account</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        {...registerForm.register("name")}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>



                    <div className="space-y-2">
                      <label htmlFor="reg-username" className="text-sm font-medium">Username</label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Choose a password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password-confirm" className="text-sm font-medium">Confirm Password</label>
                      <Input
                        id="password-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register("passwordConfirm")}
                      />
                      {registerForm.formState.errors.passwordConfirm && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.passwordConfirm.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="signup-code" className="text-sm font-medium">Signup Code (Validation)</label>
                      <Input
                        id="signup-code"
                        type="text"
                        placeholder="Enter Signup Validation Code"
                        {...registerForm.register("signupCode")}
                      />
                      <p className="text-xs text-gray-500">Ask the Developer</p>
                      {registerForm.formState.errors.signupCode && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.signupCode.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 organization-field" style={{ display: registerForm.watch("signupCode") ? "block" : "none" }}>
                      <label htmlFor="organization-name" className="text-sm font-medium">Organization Name</label>
                      <Input
                        id="organization-name"
                        type="text"
                        placeholder="Enter your organization name"
                        {...registerForm.register("organizationName")}
                      />
                      <p className="text-xs text-gray-500">Required when registering as an organization admin</p>
                      {registerForm.formState.errors.organizationName && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.organizationName.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={register.isPending}>
                      {register.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="text-primary hover:underline"
                  >
                    Login
                  </button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary items-center justify-center">
        <div className="max-w-lg px-8 py-12 text-white">
          <h2 className="text-4xl font-bold mb-6">PICA Monitoring Platform</h2>
          <p className="text-xl mb-8">
            Track and manage problems, identify corrective actions, and monitor progress all in one place.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Real-time tracking of problem identification</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Streamlined corrective action assignment</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Comprehensive dashboard with progress visualization</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Full history and audit trail of all changes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;