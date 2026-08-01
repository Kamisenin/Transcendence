import Link from "next/link";
import Image from "next/image";

export default function HomeButton() {
    return (
        <Link href="/">
            <Image src="/home.svg" alt="Logo" width={32} height={32} />
        </Link>
    );
}