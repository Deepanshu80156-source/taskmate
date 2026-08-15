import React from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-8 py-3 transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
