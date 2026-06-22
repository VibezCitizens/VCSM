---
title: UI Module — Architecture
status: STUB
feature: explore
module: ui
source: architect-derived
created: 2026-06-05
---

# explore / modules / ui — ARCHITECTURE

## Layer Stack

```
/explore (route — ui/index.jsx barrel)
  └── ExploreScreen.jsx
        ├── [no query] → ExploreFeed.jsx
        │     ├── CitizensRow.jsx
        │     ├── VportsRow.jsx
        │     └── FeaturedResultCard.jsx
        │
        └── [query present] → SearchScreen.view.jsx
              ├── FilterTabs.jsx (kind filter)
              └── ResultList.jsx
                    ├── ActorSearchResultRow.jsx → navigate /profile/{username} or /profile/{actor_id}
                    ├── PostCard.jsx → navigate /posts/{post.id}  ← raw UUID (THOR BLOCKER)
                    ├── VportsRow.jsx
                    ├── FeatureSearchResultRow.jsx
                    └── WanderCardSearch.jsx (FROZEN feature cards)
```

## Navigation Gap

```
PostCard.jsx
  └── onPress → navigate(`/posts/${post.id}`)  ← raw UUID — THOR BLOCKER

ActorSearchResultRow.jsx
  └── onPress → navigate(`/profile/${actor.username ?? actor.actor_id}`)
                                                  ↑ raw UUID fallback when username null
```

## Route Declaration

```
ui/index.jsx
  └── declares route: /explore
        public: false  ← conflicts with scanner classification
```

## TODO

- [ ] Confirm PostCard.jsx navigation target field (post.id vs post.slug)
- [ ] Confirm ActorSearchResultRow.jsx null username handling
- [ ] Reconcile route public:false with scanner public classification
