"use client";

import { Button, Card, CardContent } from "@/components/ui";  // Adjust the import according to the actual UI framework's components
import { motion } from "framer-motion";
import { Code, Users, Sparkles, GitBranch } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h1 className="text-4xl font-bold mb-4">Code Smarter, Collaborate Faster!</h1>
        <p className="text-lg text-gray-400 mb-6">AI-powered real-time code editing with seamless collaboration.</p>
        <div className="flex justify-center gap-4">
          <Button className="bg-blue-500 hover:bg-blue-600">Start Coding</Button>
          <Button variant="outline">Sign Up</Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-10 py-12">
        <FeatureCard icon={<Users />} title="Real-time Collaboration" description="Work together seamlessly with live code editing." />
        <FeatureCard icon={<Sparkles />} title="AI-driven Auto-completion" description="Get intelligent code suggestions instantly." />
        <FeatureCard icon={<Code />} title="Smart Linting" description="Identify and fix errors as you type." />
        <FeatureCard icon={<GitBranch />} title="Version Control" description="Integrated Git support for easy tracking." />
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500">
        &copy; 2025 CodeEditor. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="bg-gray-800 p-6 rounded-2xl shadow-lg">
      <CardContent className="text-center flex flex-col items-center">
        <motion.div whileHover={{ scale: 1.1 }} className="text-blue-400 text-4xl mb-4">
          {icon}
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}