import { Eye, FileText, Globe, MessageCircle, Store, User, Users, Zap } from "lucide-react";

export const PAGE_TITLE = "How to Create Your Profile | Vibez Citizens";
export const PAGE_DESCRIPTION =
  "Learn how to create your Vibez Citizens profile and start connecting with people and businesses in your area.";
export const PAGE_URL = "https://vibezcitizens.com/how-to/create-profile";
export const CTA_HREF = "/register?intent=profile";

export const ARCHITECT = {
  displayName: "Architect",
  username: "architect1",
  bio: "The founder",
  photoUrl:
    "https://cdn.vibezcitizens.com/avatar-photos/15f5c5c5-d5e5-44a1-ba3a-469a86e1cfea/2026/04/25/2dd74bd0-e587-48ab-859a-a5da223785e3.jpeg",
  bannerUrl:
    "https://cdn.vibezcitizens.com/avatar-banners/15f5c5c5-d5e5-44a1-ba3a-469a86e1cfea/2026/04/26/896b2f8c-4ba8-4f37-b5c9-24793db513f5.png",
  subscribers: 0,
};

export const VALUE_CARDS = [
  { icon: User, label: "Identity", accent: "#8b5cf6", desc: "One profile for your entire presence — no fragmentation." },
  { icon: Eye, label: "Visibility", accent: "#3b82f6", desc: "Get discovered by people nearby and across the platform." },
  { icon: MessageCircle, label: "Connection", accent: "#ec4899", desc: "Send a Vox, follow, and engage with people and businesses." },
  { icon: FileText, label: "Content", accent: "#06b6d4", desc: "Share Vibes, build your presence, and express your identity." },
];

export const STEPS = [
  { num: "01", label: "Create account", desc: "Sign up with your email and password." },
  { num: "02", label: "Set username", desc: "Pick your unique handle on the platform." },
  { num: "03", label: "Add photo & bio", desc: "Put a face and voice to your identity." },
  { num: "04", label: "Customize profile", desc: "Add your vibes, interests, and links." },
  { num: "05", label: "Go live", desc: "Your profile is instantly live and shareable." },
];

export const TRUST_CARDS = [
  { icon: Globe, label: "Public identity", desc: "Your profile is visible to the entire platform." },
  { icon: Zap, label: "Discoverable presence", desc: "Show up in local and interest-based discovery." },
  { icon: Store, label: "Connected to VPORTs", desc: "Linked to every business and service you own." },
  { icon: Users, label: "Built for community", desc: "Follow, be followed, join Districts, and engage." },
];
