'use client'

import { useState } from "react"
import { useRouter } from "next/navigation";

export default function VerifyPage() {
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage("Email verified!");
            router.push("/");
        } else {
            setMessage(data.error || "something went wrong");
        }
        setLoading(false);
    }

    async function handleResend() {
        setMessage("");
        const res = await fetch("/api/auth/resend-code", { method : "POST" });
        const data = await res.json();
        setMessage(res.ok ? "Code resent" : (data.error || "Something went wrong"));
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Verify your email</h1>
            <p className="text-sm text-gray-600 mb-4">We sent a code to your email.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder=""
                    maxLength={6}
                    className="border p-2 rounded text-black text-center tracking widest"
                    required/> 
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        {loading ? "Verifying..." : "Verify"}
                    </button>
            </form>
            <button onClick={handleResend} className="text-sm text-blue-500 underline mt-4">
                Resend code
            </button>
            {message && <p className="text-sm  mt-4">{message}</p>}
        </div>
    );
}