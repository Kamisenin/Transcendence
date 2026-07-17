'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
    const [step, setStep] = useState(1);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleStep1(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/verify_password", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({currentPassword}),
        });
        const data = await res.json();

        if (res.ok) {
            setStep(2);
        } else {
            setMessage(data.error || "Something went wrong")
        }
        setLoading(false);
    }

    async function handleStep2(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match");
            return ;
        }
        setLoading(true);
        const res = await fetch("/api/auth/change_password", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({currentPassword, newPassword}),
        });
        const data = await res.json();
        
        if (res.ok) {
            router.push("/account");
        } else {
            setMessage(data.error || "Something went wrong")
        }
        setLoading(false);
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Change password</h1>
            {step === 1 && (
                <form onSubmit={handleStep1} className="flex flex-col gap-3 w-80">
                    <p className="text-sm text-gray-600">Enter your current password</p>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="border p-2 rounded text-black" 
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        {loading ? "Checking..." : "Next"}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleStep2} className="flex flex-col  gap-3 w-80">
                    <p className="text-sm text-gray-600">Please put your new password</p>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="border p-2 rounded text-black"
                        required
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="confirm new password"
                        className="border p-2 rounded text-black"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        {loading ? "Saving..." : "Change password"}
                    </button>
                </form>
            )}

            {message && <p className="text-sm text-red-500 mt-4">{message}</p>}
        </div>
    );
}