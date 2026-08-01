'use client';

import Link from "next/link"

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
                stayConnected: form.get('stayConnected') === 'on',
            })
        });
        const j = await f.json();

        console.log(j);
        window.location.href = '/';
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Log in</h1>

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
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="stayConnected" />
                    Stay connected
                </label>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    submit
                </button>
            </form>
            <p className="text-sm mt-4">
                No account ? {" "}
                <Link href="/register" className="text-blue-500 underline">
                    Sign up
                </Link>
            </p>
        </div>
    );
}