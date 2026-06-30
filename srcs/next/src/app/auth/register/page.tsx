import { registerUser } from "%/auth/actions"

export default function RegisterPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Créer un compte</h1>

            {/* Next.js gère le lien avec le serveur automatiquement grâce à l'attribut action */}
            <form action={registerUser} className="flex flex-col gap-3 w-80">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="text"
                    name="account_id"
                    placeholder="Nom de compte"
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Mot de passe"
                    className="border p-2 rounded text-black"
                    required
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    S'inscrire
                </button>
            </form>
        </div>
    );
}