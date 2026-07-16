"use client";

import WikiEditor from "@/components/WikiEditor";


export default function Page() {
    return (
        <div className="pt-16 grid grid-cols-2 gap-4 h-[calc(100vh-4rem)]">
            <div className="h-full border rounded bg-white">
                <WikiEditor className="h-full w-full" />
            </div>
            <div className="h-full border rounded bg-white">
                <WikiEditor className="h-full w-full" />
            </div>
        </div>);
}