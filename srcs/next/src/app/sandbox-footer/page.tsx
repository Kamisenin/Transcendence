// src/app/sandbox-footer/page.tsx
import Footer from "@/components/Footer";

export default function SandboxFooterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-white">
      {/* Zone principale temporaire pour simuler du contenu sur la page */}
      <main className="p-8 flex-1">
        <h1 className="text-3xl font-bold mb-4">Page de test du Footer</h1>
        <p className="text-slate-400 mb-6">
          Cette page est une zone de bac à sable (sandbox) isolée.
          <code className="bg-slate-800 px-2 py-1 rounded mx-1 text-yellow-400">src/components/Footer.tsx</code>
        </p>
        
      </main>

      <Footer />
    </div>
  );
}