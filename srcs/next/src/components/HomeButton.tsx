import Link from "next/link";
import Image from "next/image";

export default function HomeButton() {
    return (
        <Link href="/">
            <Image src="/absolute.png" alt="Logo" width={60} height={50} style={{filter: "drop-shadow(0 0 2px black)"}} />
        </Link>
    );
}