import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useVportBusinessCardExperience } from "@/features/public/vportBusinessCard/hooks/useVportBusinessCardExperience";
import { useVportBusinessCardLeadForm } from "@/features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm";
import { useVportBusinessCardSections } from "@/features/public/vportBusinessCard/hooks/useVportBusinessCardSections";
import { getBusinessCardSettings } from "@/features/public/vportBusinessCard/model/businessCardSettings.model";
import {
  HoursSection,
  ReviewsSummarySection,
  MenuSection,
  ServicesSection,
  PortfolioSection,
  FuelPricesSection,
  AmenitiesSection,
  RatesSection,
} from "@/features/public/vportBusinessCard/view/businessCardSections";
import FS from "@/features/public/vportBusinessCard/view/businessCardFormStyles";
import { upsertMetaTag, composeAddressLabel, UnavailableState } from "@/features/public/vportBusinessCard/view/businessCardHelpers.jsx";
import BusinessCardMainCard from "@/features/public/vportBusinessCard/view/BusinessCardMainCard";
import BusinessCardLeadForm from "@/features/public/vportBusinessCard/view/BusinessCardLeadForm";

export default function VportBusinessCardPublicView({ slug }) {
  const leadFormRef = useRef(null);
  const [showForm, setShowForm] = useState(false);

  const { card, loading, error, unavailable } = useVportBusinessCardExperience({ slug });

  const profileHrefForEmail = useMemo(
    () => (slug ? `https://vibezcitizens.com/p/${slug}` : undefined),
    [slug]
  );

  const {
    values,
    setField,
    fieldErrors,
    formError,
    submitting,
    submitted,
    submit,
    reset,
  } = useVportBusinessCardLeadForm({
    slug,
    vportName: card?.businessName ?? null,
    providerProfileUrl: profileHrefForEmail ?? null,
  });

  const cs = useMemo(
    () => getBusinessCardSettings(card?.categoryKey, card?.businessCardSettings),
    [card?.categoryKey, card?.businessCardSettings]
  );

  const anySectionEnabled = useMemo(() => {
    if (!cs?.sections) return false;
    return Object.values(cs.sections).some(Boolean);
  }, [cs]);

  const { sections } = useVportBusinessCardSections({
    profileId: card?.profileId ?? null,
    enabled: anySectionEnabled,
  });

  const profileHref = useMemo(() => {
    const key = card?.slug;
    if (!key) return "";
    return `https://traze.vibezcitizens.com/us/pro/${key}`;
  }, [card?.slug]);

  const callHref = useMemo(() => {
    if (!card?.phone) return "";
    return `tel:${encodeURIComponent(card.phone)}`;
  }, [card?.phone]);

  const directionsHref = useMemo(() => {
    const addr = card?.address;
    if (addr?.line1) {
      const q = [addr.line1, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }
    const loc = card?.locationLabel;
    if (loc) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    return "";
  }, [card?.address, card?.locationLabel]);

  const smsHref = useMemo(() => {
    if (!card?.phone) return "";
    return `sms:${encodeURIComponent(card.phone)}`;
  }, [card?.phone]);

  const avatarSrc = useMemo(
    () => card?.logoUrl || card?.avatarUrl || "/avatar.jpg",
    [card?.avatarUrl, card?.logoUrl],
  );

  const ogImageUrl = useMemo(() => {
    const src = card?.logoUrl || card?.avatarUrl || "";
    if (!src) return "https://vibezcitizens.com/VportBusinnesCard.jpeg";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${window.location.origin}${src}`;
  }, [card?.avatarUrl, card?.logoUrl]);

  const addressLabel = useMemo(() => composeAddressLabel(card), [card]);

  const publicCardUrl = useMemo(() => {
    if (!slug) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vport/${slug}/card`;
  }, [slug]);

  useEffect(() => {
    if (!card) return;

    const prevTitle = document.title;
    const title = `${card.businessName} Business Card | Vibez Citizens`;
    const description = card.description
      ? `${card.businessName} on Vibez Citizens. ${card.description}`
      : `${card.businessName} business card on Vibez Citizens.`;
    const canonicalUrl = publicCardUrl || window.location.href;

    document.title = title;

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    const canonicalCreated = !canonicalEl;
    const prevCanonical = canonicalEl?.getAttribute("href") ?? null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    const cleanups = [
      upsertMetaTag({ name: "description",         content: description }),
      upsertMetaTag({ property: "og:title",         content: title }),
      upsertMetaTag({ property: "og:description",   content: description }),
      upsertMetaTag({ property: "og:type",          content: "website" }),
      upsertMetaTag({ property: "og:url",           content: canonicalUrl }),
      upsertMetaTag({ property: "og:image",         content: ogImageUrl }),
      upsertMetaTag({ name: "twitter:card",         content: "summary_large_image" }),
      upsertMetaTag({ name: "twitter:title",        content: title }),
      upsertMetaTag({ name: "twitter:description",  content: description }),
      upsertMetaTag({ name: "twitter:image",        content: ogImageUrl }),
    ];

    return () => {
      document.title = prevTitle;
      if (canonicalCreated) { canonicalEl.remove(); }
      else if (prevCanonical !== null) { canonicalEl.setAttribute("href", prevCanonical); }
      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        try { cleanups[i]?.(); } catch { /* no-op */ }
      }
    };
  }, [card, ogImageUrl, publicCardUrl]);

  const scrollToLeadForm = useCallback(() => {
    setShowForm(true);
    setTimeout(() => {
      leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const id = setTimeout(() => {
      reset();
      setShowForm(false);
    }, 2000);
    return () => clearTimeout(id);
  }, [submitted, reset]);

  if (loading) {
    return <UnavailableState title="Loading card…" subtitle="Please wait a moment." />;
  }

  if (!slug) {
    return (
      <UnavailableState
        title="Card unavailable"
        subtitle="This business card link is missing a slug."
      />
    );
  }

  if (unavailable) {
    return (
      <UnavailableState
        title="Card unavailable"
        subtitle={
          error?.message
            ? String(error.message)
            : "This business card is not published or no longer available."
        }
      />
    );
  }

  const locationText = (card.address?.line1 ? addressLabel : null) || card.locationLabel || addressLabel || null;
  const hasContacts = card.phone || locationText || card.email;

  const visibleCallBtn = cs.actions?.show_call_btn !== false && !!callHref;
  const visibleTextBtn = cs.actions?.show_text_btn !== false && !!smsHref;
  const visibleProfileBtn = cs.actions?.show_profile_btn !== false && !!profileHref;
  const hasCta = visibleCallBtn || visibleTextBtn || visibleProfileBtn;

  return (
    <div style={FS.page}>
      <div style={FS.container}>

        <BusinessCardMainCard
          card={card}
          cs={cs}
          avatarSrc={avatarSrc}
          callHref={callHref}
          smsHref={smsHref}
          profileHref={profileHref}
          locationText={locationText}
          hasContacts={hasContacts}
          visibleCallBtn={visibleCallBtn}
          visibleTextBtn={visibleTextBtn}
          visibleProfileBtn={visibleProfileBtn}
          hasCta={hasCta}
          directionsHref={directionsHref}
          scrollToLeadForm={scrollToLeadForm}
        />

        {cs.sections?.show_services && <ServicesSection services={sections?.services} />}
        {cs.sections?.show_portfolio && <PortfolioSection portfolio={sections?.portfolio} />}
        {cs.sections?.show_menu && <MenuSection slug={card.slug} />}
        {cs.sections?.show_fuel_prices && <FuelPricesSection fuelPrices={sections?.fuel_prices} />}
        {cs.sections?.show_amenities && <AmenitiesSection amenities={sections?.amenities} />}
        {cs.sections?.show_rates && <RatesSection rates={sections?.rates} />}
        {cs.sections?.show_hours && <HoursSection hours={card.hours} />}
        {cs.sections?.show_reviews_section && (
          <ReviewsSummarySection reviewCount={card.reviewCount} averageRating={card.averageRating} />
        )}

        {showForm && cs.actions?.show_request_btn !== false && (
          <BusinessCardLeadForm
            ref={leadFormRef}
            card={card}
            values={values}
            setField={setField}
            fieldErrors={fieldErrors}
            formError={formError}
            submitting={submitting}
            submitted={submitted}
            submit={submit}
          />
        )}

      </div>
    </div>
  );
}
