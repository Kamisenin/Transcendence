import FooterRecommendations from "@/components/FooterRecommendations";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Contenu principal de la page wiki ([slug], liste, etc.) */}
      <main className="flex-grow">{children}</main>

      {/* Le Footer sera affiché en bas de TOUTES les pages wiki */}
      <FooterRecommendations />
    </div>
  );
}