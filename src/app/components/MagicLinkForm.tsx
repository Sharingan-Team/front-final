"use client";

import { useState } from "react";
import { generateMagicLink } from "../actions/magicLink";

export function MagicLinkForm() {
    const [result, setResult] = useState<{
        success?: boolean;
        magicLink?: string;
        username?: string;
        error?: string;
    } | null>(null);

    async function handleGenerateMagicLink(formData: FormData) {
        const response = await generateMagicLink(formData);
        setResult(response);
    }

    return (
        <>
            <form action={handleGenerateMagicLink}>
                <div className="mb-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'utilisateur du destinataire
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Entrez le nom d'utilisateur"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Générer un magic link
                </button>
            </form>

            {result && result.success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-lg font-medium text-green-800">Magic link généré avec succès</h3>
                    <p className="text-sm text-green-700 mt-1">
                        Pour l'utilisateur: <strong>{result.username}</strong>
                    </p>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-green-700 mb-1">Magic Link:</label>
                        <div className="flex">
                            <input
                                type="text"
                                readOnly
                                value={result.magicLink}
                                className="flex-grow px-3 py-2 bg-white border border-green-300 rounded-l-md text-sm"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(result.magicLink || "");
                                }}
                                className="bg-green-600 text-white px-4 rounded-r-md hover:bg-green-700"
                            >
                                Copier
                            </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            Ce lien est à usage unique et expirera après utilisation.
                        </p>
                    </div>
                </div>
            )}

            {result && result.error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{result.error}</p>
                </div>
            )}
        </>
    );
}
