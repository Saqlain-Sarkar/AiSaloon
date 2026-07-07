"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles, Building } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  businessName: z.string().min(2, { message: "Business name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://aisaloon.onrender.com/api/v1"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Registration failed");
      }
      
      localStorage.setItem("accessToken", json.access_token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold tracking-tight text-white">AiSalonOS</h1>
        </div>
      </div>
      
      <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
          <CardDescription className="text-neutral-400">
            Start managing your salon with AI-powered tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-neutral-300">Salon Name</Label>
                <Input 
                  id="businessName" 
                  placeholder="Glow Salon" 
                  className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500"
                  {...register("businessName")}
                />
                {errors.businessName && (
                  <p className="text-red-500 text-xs mt-1">{errors.businessName.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Work Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-purple-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors h-11 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <Building className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-neutral-800 pt-6">
          <p className="text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
