import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Header />

      {/* Hero Section */}
      <main className="relative">
        {/* Abstract Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-20 relative">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                🚀 Powered by Turborepo
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Build Faster
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x">
                Ship Smarter
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              A modern full-stack starter kit combining Next.js 15 and NestJS in a
              powerful Turborepo monorepo. Everything you need to build
              production-ready web applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
                Start Building →
              </button>
              <button className="px-8 py-4 bg-card text-card-foreground rounded-xl font-semibold border border-border hover:border-primary/50 hover:bg-accent/50 hover:scale-105 transition-all duration-300">
                Explore Docs
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
            {[
              { label: "Components", value: "50+" },
              { label: "Type Safe", value: "100%" },
              { label: "Performance", value: "A+" },
              { label: "Apps", value: "2" },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 transition-all"
              >
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div id="features" className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="border-b-4 border-primary/20 pb-2">Everything You Need</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Built with the best tools and practices
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "⚡",
                  title: "Lightning Fast",
                  description:
                    "Optimized build times with Turborepo's intelligent caching and parallel execution",
                },
                {
                  icon: "🎨",
                  title: "Beautiful UI",
                  description:
                    "Crafted with Tailwind CSS and Shadcn UI components for a stunning interface",
                },
                {
                  icon: "🔒",
                  title: "Type Safety",
                  description:
                    "End-to-end TypeScript coverage ensures reliability and better developer experience",
                },
                {
                  icon: "📱",
                  title: "Responsive",
                  description:
                    "Mobile-first design approach ensures your app looks great on any device",
                },
                {
                  icon: "🌙",
                  title: "Dark Mode",
                  description:
                    "Built-in dark mode support with smooth transitions and system preferences",
                },
                {
                  icon: "🔧",
                  title: "Developer Ready",
                  description:
                    "ESLint, Prettier, and Git hooks configured for optimal development workflow",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group p-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 hover:bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div id="tech" className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="border-b-4 border-primary/20 pb-2">Powerful Tech Stack</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Industry-leading technologies working together
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card/30 backdrop-blur-md rounded-3xl p-10 border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">⚛️</span>
                  Frontend
                </h3>
                <div className="space-y-3 relative z-10">
                  {[
                    {
                      name: "Next.js 15",
                      desc: "React framework with App Router",
                    },
                    { name: "React 19", desc: "Latest UI library features" },
                    { name: "TypeScript 5", desc: "Type-safe JavaScript" },
                    { name: "Tailwind CSS", desc: "Utility-first styling" },
                    { name: "Shadcn UI", desc: "Accessible components" },
                  ].map((tech, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg group hover:bg-card transition-colors"
                    >
                      <span className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">✓</span>
                      <div>
                        <div className="font-semibold">
                          {tech.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tech.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card/30 backdrop-blur-md rounded-3xl p-10 border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">🔧</span>
                  Backend Ready
                </h3>
                <div className="space-y-3 relative z-10">
                  {[
                    { name: "NestJS", desc: "Progressive Node.js framework" },
                    { name: "PostgreSQL", desc: "Reliable database solution" },
                    { name: "Prisma", desc: "Next-gen ORM" },
                    { name: "JWT Auth", desc: "Secure authentication" },
                    { name: "GraphQL/REST", desc: "Flexible API options" },
                  ].map((tech, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg group hover:bg-card transition-colors"
                    >
                      <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center text-xs group-hover:translate-x-1 transition-transform">→</span>
                      <div>
                        <div className="font-semibold">
                          {tech.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tech.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div id="docs" className="mb-24">
            <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 rounded-3xl p-12 border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-primary-foreground/80">Get up and running in minutes</p>
              </div>
              <div className="bg-slate-950 rounded-2xl p-8 max-w-2xl mx-auto relative z-10 shadow-2xl">
                <div className="space-y-6 font-mono text-sm">
                  {[
                    { comment: "# Clone the repository", cmd: "git clone [your-repo-url]" },
                    { comment: "# Install dependencies", cmd: "pnpm install" },
                    { comment: "# Start development servers", cmd: "pnpm dev" }
                  ].map((step, i) => (
                    <div key={i}>
                      <p className="text-slate-500 mb-1 select-none">{step.comment}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 select-none">$</span>
                        <code className="text-emerald-400">{step.cmd}</code>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-slate-400">
                      🎉 Open http://localhost:3000 to see this app
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mb-12">
            <div className="bg-card/50 backdrop-blur-md rounded-3xl p-12 border border-border">
              <h2 className="text-3xl font-bold mb-4">
                Start Building Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join developers who are shipping faster with this production-ready
                starter kit
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
                  View on GitHub
                </button>
                <button className="px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent hover:scale-105 transition-all duration-300">
                  Read Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center py-12 border-t border-border">
            <p className="text-muted-foreground mb-2">
              Built with ❤️ using Next.js, NestJS, and Turborepo
            </p>
            <p className="text-sm text-muted-foreground/70">
              © 2025 Your Starter Kit. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
