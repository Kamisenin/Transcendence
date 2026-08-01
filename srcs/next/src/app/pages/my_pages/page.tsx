"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Page = {
    pageId: number;
    title: string;
    createAt: string;
    lastModified: string;
}

export default function MyPages() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow flex flex-col gap-6">
                You haven't created any page yet
            </div>
        </main>
    );
}