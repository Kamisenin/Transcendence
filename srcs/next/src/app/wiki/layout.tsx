import FooterRecommendations from "@/components/FooterRecommendations";
import { getCurrentUser } from "@/app/lib/session"; // 1. Import de la session

export default async function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Contenu principal de la page wiki ([slug], liste, etc.) */}
      <main className="flex-grow">{children}</main>

      {/* 3. Transmettre le user_id de l'user au Footer */}
      <FooterRecommendations userId={user?.user_id} />
    </div>
  );
}