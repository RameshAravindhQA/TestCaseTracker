import { useEffect, useState } from "react";
import { ResetPasswordForm } from "@/components/authentication/reset-password-form";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

export default function ResetPassword() {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");

    if (!tokenParam) {
      setError("Reset token is missing. Please check your reset link.");
      setLoading(false);
    } else {
      setToken(tokenParam);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Helmet>
          <title>Reset Password | Test Case Tracker</title>
        </Helmet>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Helmet>
          <title>Error | Test Case Tracker</title>
        </Helmet>
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md border border-border">
          <h1 className="text-2xl font-bold text-center mb-6 text-card-foreground">Password Reset Error</h1>
          <p className="text-red-500 text-center mb-4">{error}</p>
          <div className="flex justify-center">
            <button 
              onClick={() => navigate("/forgot-password")} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Helmet>
        <title>Reset Password | Test Case Tracker</title>
      </Helmet>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Test Case Tracker</h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
