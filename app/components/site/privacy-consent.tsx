import { Link } from "react-router";

export function PrivacyConsent({ error }: { error?: string[] }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input
          type="checkbox"
          name="privacy"
          required
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-4 rounded border-stone-300 accent-forest-700"
        />
        <span>
          He leído y acepto el{" "}
          <Link to="/aviso-de-privacidad" target="_blank" className="font-medium text-forest-700 underline">
            aviso de privacidad
          </Link>
          .
        </span>
      </label>
      {error?.[0] && <p className="mt-1 text-sm text-red-600">{error[0]}</p>}
    </div>
  );
}
