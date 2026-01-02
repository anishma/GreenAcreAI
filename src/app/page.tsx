export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          GreenAcre <span className="text-[#81c784]">AI</span>
        </h1>
        <p className="text-center text-2xl text-white/80">
          Enterprise-Grade Multi-Tenant Voice AI Platform
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Voice-First AI</h3>
            <div className="text-lg text-white/80">
              Natural voice conversations powered by VAPI and custom LangGraph agents
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Multi-Tenant</h3>
            <div className="text-lg text-white/80">
              Secure tenant isolation with Row-Level Security and RBAC
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-white/60">
            🚧 Phase 0: Infrastructure Setup In Progress
          </p>
        </div>
      </div>
    </main>
  )
}
