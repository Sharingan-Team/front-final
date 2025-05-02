"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"login" | "register">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [loginForm, setLoginForm] = useState({ username: "", password: "", rememberMe: false });
    const [registerForm, setRegisterForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!loginForm.username || !loginForm.password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setIsLoading(true);

            const response = await authClient.signIn.email({
                email: loginForm.username,
                password: loginForm.password,
                rememberMe: loginForm.rememberMe,
            });
            console.log("Response:", response);

            if (response.error?.message) {
                setError("Invalid username or password");
                console.error("Login error:", response.error);
                return;
            }
            console.log("Login successful:", response);

            // Add actual login logic here
            console.log("Login attempt with:", loginForm);
            router.push("/"); // Redirect to the home page or dashboard after successful login
            // Redirect or handle successful login
        } catch (err) {
            setError("Invalid username or password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!registerForm.username || !registerForm.email || !registerForm.password) {
            setError("Please fill in all required fields");
            return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (registerForm.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerForm.email)) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            setIsLoading(true);
            const response = await authClient.signUp.email({
                name: registerForm.username,
                email: registerForm.email,
                password: registerForm.password,
                callbackURL: "/",
            });

            if (response.error?.message) {
                setError("Registration failed. Please try again.");
                console.error("Registration error:", response.error);
                return;
            }
            console.log("Registration successful:", response);

            router.push("/"); // Redirect to the home page or dashboard after successful login

            // Redirect or handle successful registration
        } catch (err) {
            setError("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {tab === "login" ? "Welcome back" : "Create an account"}
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        {tab === "login"
                            ? "Enter your credentials to sign in to your account"
                            : "Enter your information to create an account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={tab} onValueChange={(e: any) => setTab(e)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <form className="space-y-4" onSubmit={handleLoginSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="login-username">Email</Label>
                                    <Input
                                        id="login-username"
                                        type="email"
                                        placeholder="yourusername"
                                        required
                                        value={loginForm.username}
                                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="remember-me"
                                            checked={loginForm.rememberMe}
                                            onCheckedChange={(checked: boolean) =>
                                                setLoginForm({ ...loginForm, rememberMe: checked as boolean })
                                            }
                                        />
                                        <label
                                            htmlFor="remember-me"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Remember me
                                        </label>
                                    </div>
                                    <a href="#" className="text-sm text-primary hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-300"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" type="button">
                                        Google
                                    </Button>
                                    <Button variant="outline" type="button">
                                        GitHub
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                        <TabsContent value="register">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="register-username">Username</Label>
                                    <Input
                                        id="register-username"
                                        type="text"
                                        placeholder="yourusername"
                                        required
                                        value={registerForm.username}
                                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="youremail@example.com"
                                        required
                                        value={registerForm.email}
                                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Password</Label>
                                    <Input
                                        id="register-password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                                    <Input
                                        id="register-confirm-password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={registerForm.confirmPassword}
                                        onChange={(e) =>
                                            setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                                        }
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Creating account..." : "Register"}
                                </Button>
                                <div className="text-center text-sm text-muted-foreground">
                                    By creating an account, you agree to our
                                    <a href="#" className="text-primary hover:underline ml-1">
                                        Terms of Service
                                    </a>
                                    <span> and </span>
                                    <a href="#" className="text-primary hover:underline">
                                        Privacy Policy
                                    </a>
                                    .
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
