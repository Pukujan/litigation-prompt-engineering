import { useEffect, useState } from "react";
import { apiDownload, apiGet } from "../../../shared/api/client.js";

export function OnboardingPage() {
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet("/api/platform/onboarding/pipeline-guide?format=json")
      .then(setGuide)
      .catch(setError);
  }, []);

  return (
    <section className="card">
      <h2>Pipeline onboarding</h2>
      <p className="muted">
        How Case Filing batches, modules, evals, and downloads work.
      </p>
      <p>
        <button
          type="button"
          onClick={() =>
            apiDownload(
              "/api/platform/onboarding/pipeline-guide?format=md&download=true",
              "pipeline-guide.md"
            )
          }
        >
          Download guide (.md)
        </button>
      </p>
      {error && <p className="error-text">{error.message}</p>}
      {guide?.sections?.map((section) => (
        <article key={section.id} className="onboarding-section">
          <h3>{section.title}</h3>
          <pre className="onboarding-md">{section.bodyMd}</pre>
        </article>
      ))}
    </section>
  );
}
