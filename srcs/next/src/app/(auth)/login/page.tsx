'use client';

export default function LoginPage() {

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const f = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: form.get('id'),
                password: form.get('password'),
            })
        });
        const j = await f.json();

        console.log(j);
        window.location.href = '/';
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Connexion</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="text"
                    name="id"
                    placeholder="Email or account name"
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="border p-2 rounded text-black"
                    required
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Se connecter
                </button>
            </form>
        </div>
    );
}