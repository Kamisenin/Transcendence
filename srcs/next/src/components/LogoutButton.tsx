"use client";

export default function LogoutButton() {
    const handleLogout = async () => {
        const res = await fetch("/api/auth/logout", {method: "POST"});

        if (res.ok)
            window.location.reload();
        else
            console.error("Unable to logout");
    };
    return (
        <button className={"border-solid"} onClick={handleLogout}>Disconnect</button>
    );
}