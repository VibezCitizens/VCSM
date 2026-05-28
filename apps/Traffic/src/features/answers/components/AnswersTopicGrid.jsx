"use client";

import { useTrafficLanguage } from "@/lib/language";

const DEFAULT_DISCOVERY_TOPICS = [
  "Locksmith",
  "Barber",
  "Restaurants",
  "Auto Repair",
  "Immigration",
  "Money Exchange"
];

function buildTopicCards(topics = []) {
  if (topics.length > 0) {
    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description
    }));
  }

  return DEFAULT_DISCOVERY_TOPICS.map((name) => ({
    id: name,
    name,
    description: null
  }));
}

export function AnswersTopicGrid({ topics = [] }) {
  const { t } = useTrafficLanguage();
  const cards = buildTopicCards(topics);

  return (
    <section className="answers-topic-grid" aria-label={t("answers.topicsAria")}>
      <div className="answers-section-heading">
        <p>{t("answers.topicsKicker")}</p>
        <h2>{t("answers.topics")}</h2>
      </div>

      <ul>
        {cards.map((topic) => (
          <li key={topic.id} className="answers-topic-card">
            <div className="answers-topic-card__icon" aria-hidden="true" />
            <strong className="answers-topic-card__name">{topic.name}</strong>
            <span className="answers-topic-card__desc">{topic.description || t("answers.topicCardLabel")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
