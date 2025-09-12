import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/index.js";
import { Sparkles, Zap, ArrowRight, Monitor, Shield, Code2 } from "lucide-react";
import { Button } from "../components/ui/button"; // optional if you add shadcn later

export default function Home() {
  const handleGetStarted = async () => {
    window.location.href = createPageUrl("Chat");
  };

  return (
    <div className="sparkle-bg">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-teal-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-32 text-center">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Transform Ideas Into
           <span className="block bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">Desktop and <span className="text-violet-500 bg-none">Mobile</span> Applications</span>


          </h1>
          <p className="text-lg text-slate-300 mb-8">
            The first AI platform that builds complete, downloadable desktop/mobile
            apps—not just websites.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 text-lg rounded-lg magic-glow"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link to={createPageUrl("Demo")}>
              <Button className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 py-4 text-lg rounded-lg border">
                <Zap className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 magic-glow">
            <Monitor className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white">Native Desktop Apps</h3>
            <p className="text-slate-300">
              Generate real executables for Windows, macOS, and Linux. No web
              wrappers—real native applications.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 magic-glow">
            <Shield className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-white">Built-in Security</h3>
            <p className="text-slate-300">
              Automated security scans, vulnerability detection, and
              enterprise-grade protection.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 magic-glow">
            <Code2 className="w-12 h-12 text-teal-400 mb-4" />
            <h3 className="text-xl font-bold text-white">Full-Stack Generation</h3>
            <p className="text-slate-300">
              Complete applications with frontend, backend, and database—all
              generated from a simple description.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
