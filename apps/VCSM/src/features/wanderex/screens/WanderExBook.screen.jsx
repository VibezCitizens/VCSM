import { useMemo } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useWanderExProfile } from "@/features/wanderex/hooks/useWanderExProfile";
import { useWanderExBookingFlow } from "@/features/wanderex/hooks/useWanderExBookingFlow";
import { useWanderExSeo } from "@/features/wanderex/hooks/useWanderExSeo";
import { useWanderExAnalytics } from "@/features/wanderex/hooks/useWanderExAnalytics";
import { WanderExTopNav } from "@/features/wanderex/components/WanderExTopNav";
import {
  ServiceStep,
  BarberStep,
  TimeStep,
  DetailsStep,
  ConfirmStep,
} from "@/features/wanderex/screens/WanderExBookingSteps";
import "@/features/wanderex/styles/wanderex-public.css";

export function WanderExBookScreen() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const track = useWanderExAnalytics({ page: "booking", slug });

  const initialServiceId = searchParams.get("service") || null;
  const initialBarberActorId = searchParams.get("barber") || null;

  const { loading, error, bundle } = useWanderExProfile(slug);

  const flow = useWanderExBookingFlow({
    slug,
    profile: bundle?.profile,
    services: bundle?.bookableServices || bundle?.services || [],
    team: bundle?.team || [],
    availabilityCalendarByResource: bundle?.availabilityCalendarByResource || {},
    initialServiceId,
    initialBarberActorId,
    onBookingStarted: (payload) => track("booking_started", payload),
    onBookingCompleted: (payload) => track("booking_completed", payload),
  });

  const profile = bundle?.profile || null;

  useWanderExSeo({
    title: profile?.name ? `Book ${profile.name} | WanderEx` : "Book service | WanderEx",
    description:
      profile?.name
        ? `Book ${profile.name} through WanderEx. Select service, barber lane, and request your time instantly.`
        : "Book services through WanderEx with no login.",
    canonicalPath: profile?.slug ? `/p/${profile.slug}/book` : `/p/${slug || ""}/book`,
    imageUrl: profile?.logoUrl || profile?.avatarUrl || "",
  });

  const selectedStep = flow.stepKey;

  const selectedBarberLabel = useMemo(() => {
    if (!flow.selectedBarber) return "Auto-assign best available";
    return flow.selectedBarber.name;
  }, [flow.selectedBarber]);

  if (loading) {
    return (
      <div className="wx-page">
        <WanderExTopNav />
        <main className="wx-container">
          <p className="wx-empty">Loading booking flow...</p>
        </main>
      </div>
    );
  }

  if (error || !bundle || !profile) {
    return (
      <div className="wx-page">
        <WanderExTopNav />
        <main className="wx-container">
          <div className="wx-section">
            <h1 className="wx-section-title">Booking unavailable</h1>
            <p className="wx-empty">{error?.message || "This profile is not publicly bookable."}</p>
            <Link className="wx-secondary-btn" to={`/p/${slug || ""}`}>
              Back to profile
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (flow.submitted) {
    return (
      <div className="wx-page">
        <WanderExTopNav />
        <main className="wx-container">
          <section className="wx-section">
            <h1 className="wx-section-title">Booking request sent</h1>
            <p className="wx-hero-subtitle">
              Your request was submitted as a lead to {profile.name}. They will contact you directly.
            </p>
            <div className="wx-step-actions">
              <Link className="wx-secondary-btn" to={`/p/${profile.slug}`}>
                Back to profile
              </Link>
              <Link className="wx-primary-btn" to="/us">
                Browse more providers
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="wx-page">
      <WanderExTopNav />
      <main className="wx-container">
        <section className="wx-step-shell">
          <div className="wx-step-header">
            {flow.steps.map((step, index) => (
              <span
                key={step}
                className={`wx-step-dot ${index <= flow.stepIndex ? "is-active" : ""}`}
              />
            ))}
          </div>

          <article className="wx-step-card">
            <h1 className="wx-step-title">Request booking with {profile.name}</h1>
            <p className="wx-step-subtitle">No login required. We send this as a lead request.</p>

            {selectedStep === "service" && <ServiceStep flow={flow} />}
            {selectedStep === "barber" && <BarberStep flow={flow} />}
            {selectedStep === "time" && <TimeStep flow={flow} />}
            {selectedStep === "details" && <DetailsStep flow={flow} />}
            {selectedStep === "confirm" && (
              <ConfirmStep flow={flow} selectedBarberLabel={selectedBarberLabel} />
            )}

            <div className="wx-step-actions">
              <button
                type="button"
                className="wx-secondary-btn"
                onClick={flow.goBack}
                disabled={flow.stepIndex === 0}
              >
                Back
              </button>

              {selectedStep !== "confirm" ? (
                <button
                  type="button"
                  className="wx-primary-btn"
                  onClick={flow.goNext}
                  disabled={!flow.canProceed}
                >
                  Continue
                </button>
              ) : null}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default WanderExBookScreen;
