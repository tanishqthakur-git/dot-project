"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

const Login = () => {
 

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <Card className="w-full max-w-md p-4">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form  className="space-y-4">
            {/* Email Input */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register">
                <span className="text-blue-500 font-semibold">Register</span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
