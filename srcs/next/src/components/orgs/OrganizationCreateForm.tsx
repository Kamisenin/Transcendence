"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createOrganization } from "@/actions/orgs";

const MAX_NAME_LENGTH = 20;
const ORGANIZATION_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

function getOrganizationError(code: string, t: ReturnType<typeof useTranslations>) {
    switch (code) {
        case "ORGANIZATION_NAME_REQUIRED": return t("organizationNameRequired");
        case "ORGANIZATION_NAME_TOO_LONG": return t("organizationNameTooLong");
        case "ORGANIZATION_NAME_INVALID": return t("organizationNameInvalid");
        default: return t("organizationCreateFailed");
    }
}

export default function OrganizationCreateForm() {
    const t = useTranslations("Orgs");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function validate(value: string) {
        if (!value) return "ORGANIZATION_NAME_REQUIRED";
        if (value.length > MAX_NAME_LENGTH) return "ORGANIZATION_NAME_TOO_LONG";
        if (!ORGANIZATION_NAME_PATTERN.test(value)) return "ORGANIZATION_NAME_INVALID";
        return null;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedName = name.trim();
        const validationError = validate(normalizedName);
        setError(validationError);
        if (validationError) return;

        setIsSubmitting(true);
        try {
            await createOrganization(normalizedName);
            window.location.reload();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "ORGANIZATION_CREATE_FAILED");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <div>
                <input
                    name="name"
                    value={name}
                    maxLength={MAX_NAME_LENGTH}
                    onChange={(event) => {
                        setName(event.target.value);
                        if (error) setError(validate(event.target.value.trim()));
                    }}
                    placeholder={t("newOrganizationPlaceholder")}
                    aria-invalid={!!error}
                    aria-describedby={error ? "organization-name-error" : undefined}
                    className="border border-[#d9bfb7] bg-[#fffaf7] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9bfb7]"
                />
                {error && <p id="organization-name-error" className="mt-1 max-w-64 text-xs text-[#a33a2b]">{getOrganizationError(error, t)}</p>}
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center bg-[#800000] px-3 py-1.5 text-sm font-medium text-[#fffaf7] hover:bg-[#5f0000] disabled:opacity-60"
            >
                {isSubmitting ? t("creatingOrganization") : t("newOrganization")}
            </button>
        </form>
    );
}
