"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Code, Users, Sparkles, GitBranch } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h1 className="text-5xl font-bold mb-4 text-blue-400">
          AI-Powered Code Editor
        </h1>
        <p className="text-lg text-gray-400 mb-6">
          Write, collaborate, and debug with AI-assisted coding in real-time.
        </p>
        <div className="flex justify-center gap-4">
          <Button className="bg-blue-500 hover:bg-blue-600">Start Coding</Button>
          <Button className="bg-white text-gray-800 hover:bg-gray-100">
  Sign Up / Log In
</Button>

        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-10 py-12">
        <FeatureCard
          icon={<Users />}
          title="Real-time Collaboration"
          description="Work together seamlessly with live code editing."
          titleColor="text-green-400"
        />
        <FeatureCard
          icon={<Sparkles />}
          title="AI-driven Auto-completion"
          description="Get intelligent code suggestions instantly."
          titleColor="text-yellow-400"
        />
        <FeatureCard
          icon={<Code />}
          title="Smart Linting"
          description="Identify and fix errors as you type."
          titleColor="text-red-400"
        />
        <FeatureCard
          icon={<GitBranch />}
          title="Version Control"
          description="Integrated Git support for easy tracking."
          titleColor="text-purple-400"
        />
      </section>

      {/* Code Editor Preview */}
      <section className="flex justify-center items-center py-16">
        <motion.div
          className="w-3/4 bg-gray-800 rounded-xl shadow-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-blue-300 font-mono">def hello_world():</p>
          <p className="text-green-400 font-mono pl-6">
            print("Hello, AI-Powered Code Editor!")
          </p>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="px-10 py-12 text-center">
        <h2 className="text-3xl font-bold mb-6 text-blue-400">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Testimonial
            name="Alex"
            feedback="This AI-powered editor has transformed the way I code!"
          />
          <Testimonial
            name="Taylor"
            feedback="The real-time collaboration is a game-changer!"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500">
        &copy; 2025 CodeEditor. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, titleColor = "text-blue-400" }) {
  return (
    <Card className="bg-gray-800 p-6 rounded-2xl shadow-lg">
      <CardContent className="text-center flex flex-col items-center">
        <motion.div whileHover={{ scale: 1.1 }} className="text-blue-400 text-4xl mb-4">
          {icon}
        </motion.div>
        <h3 className={`text-xl font-semibold mb-2 ${titleColor}`}>{title}</h3>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function Testimonial({ name, feedback }) {
  return (
    <Card className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <CardContent>
        <p className="italic text-gray-300">"{feedback}"</p>
        <p className="text-blue-400 mt-4">- {name}</p>
      </CardContent>
    </Card>
  );
}
