import Image from "next/image";

type Props = {
    accountId: string;
    imgLink?: string | null;
    alt?: string;
    size?: number;
    className?: string;
};

function hasProfileImage(imgLink?: string | null) {
    return Boolean(imgLink && !imgLink.endsWith("/defaultUserProfilePicture.svg") && !imgLink.endsWith("/default-avatar.png"));
}

export default function UserAvatar({ accountId, imgLink, alt, size = 40, className = "" }: Props) {
    const label = accountId.trim().charAt(0).toUpperCase() || "?";

    if (!hasProfileImage(imgLink)) {
        return (
            <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#800000] font-semibold text-[#fffaf7] ${className}`}
                style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.4)) }}
                aria-label={alt || accountId}
            >
                {label}
            </span>
        );
    }

    const imageSrc = imgLink as string;

    return (
        <Image
            src={imageSrc}
            alt={alt || accountId}
            width={size}
            height={size}
            className={`shrink-0 rounded-full object-cover ${className}`}
        />
    );
}
