import type { CmsPage } from "@/types";

const NOTE = "> PLACEHOLDER CONTENT — not legal advice. Replace with counsel-approved language before launch.\n\n";
const at = new Date().toISOString();

/**
 * Admin-editable placeholder content. Lightweight markup: `## Heading`, `- bullet`, blank line = paragraph.
 * Do NOT treat any of this as final legal language.
 */
export const DEFAULT_CONTENT: CmsPage[] = [
  {
    slug: "terms", title: "Terms and Conditions", updatedAt: at,
    body: `${NOTE}## 1. Who can use KodeCupid\nKodeCupid is for adults aged 18+ who work in healthcare, education, college/university, science, public health, or related professions. [Placeholder: eligibility rules.]\n\n## 2. Your account\nYou agree to provide accurate information and keep your login secure. [Placeholder: account responsibilities.]\n\n## 3. Community Guidelines\nYou agree to follow our Community Pledge and to treat other members with respect. [Placeholder: conduct rules and enforcement.]\n\n## 4. Subscriptions and payments\nPaid features, billing cycles, cancellations and refunds are described here. [Placeholder: billing terms.]\n\n## 5. Termination\nWe may suspend or remove accounts that violate these terms. You may close your account at any time. [Placeholder.]`,
  },
  {
    slug: "privacy-policy", title: "Privacy Policy", updatedAt: at,
    body: `${NOTE}## What we collect\nProfile details you provide, verification information, and basic usage data. [Placeholder: data inventory.]\n\n## How we use it\nTo run matching, keep the community safe, and improve KodeCupid. [Placeholder: legal bases / purposes.]\n\n## Sensitive information\nYou control whether details like religion, political views and ethnicity are visible on your profile. [Placeholder.]\n\n## Workplace privacy\nYou can hide your profile near your workplace. [Placeholder: location handling.]\n\n## Your choices\nYou can edit your profile, export your data, or request deletion at any time via the Account Closure page. [Placeholder: rights and retention.]`,
  },
  {
    slug: "faqs", title: "Frequently Asked Questions", updatedAt: at,
    body: `## Who is KodeCupid for?\nVerified professionals in healthcare, education, higher education, science and public health. [Placeholder answer.]\n\n## How does verification work?\nYou can verify with an NPI number or by uploading a work badge, license or ID. A moderator reviews manual submissions. [Placeholder answer.]\n\n## What is shift-aware matching?\nWe compare work patterns — days, nights, swings, regular hours or variable — so you meet people whose free time actually lines up with yours. [Placeholder answer.]\n\n## Can my coworkers see me?\nTurn on Workplace Privacy and we hide your profile within the radius you choose around your workplace. [Placeholder answer.]\n\n## How do I delete my account?\nUse the Account Closure / Data Deletion form linked in the footer. [Placeholder answer.]`,
  },
  {
    slug: "community-pledge", title: "Community Pledge", updatedAt: at,
    body: `${NOTE}## Our promise to each other\n- I will be honest about who I am and what I do.\n- I will treat every member with kindness and respect.\n- I will respect boundaries, and accept a "no" gracefully.\n- I will protect other members' privacy — including where they work.\n- I will never ask for money, gift cards or financial details.\n- I will report behavior that makes me or others feel unsafe.\n\n## What happens if someone breaks the pledge\nReports are reviewed by our moderation team. Outcomes can include a warning, suspension, or removal. [Placeholder: enforcement ladder.]`,
  },
  {
    slug: "safety-tips", title: "Safety Tips", updatedAt: at,
    body: `${NOTE}## Before you meet\n- Chat in the app first. Keep personal contact info private until you're comfortable.\n- Look for the verified badge, but remember verification isn't a background check.\n- Try a video call when it's available.\n\n## Your first date\n- Meet somewhere public, close to a place you know — our micro-date venues are all public.\n- Tell a friend where you're going and when you'll be back.\n- Arrange your own transport.\n\n## Protect your professional privacy\n- Turn on Workplace Privacy.\n- Avoid sharing patient, student or research details.\n\n## If something feels wrong\n- Trust your instincts, leave, and use Report or Block in the app.\n- In an emergency, call 911. If you're in crisis, call or text 988 (US).`,
  },
  {
    slug: "contact", title: "Contact Us", updatedAt: at,
    body: `${NOTE}## Support\nEmail: support@kodecupid.example (placeholder)\n\n## Press & partnerships\nEmail: hello@kodecupid.example (placeholder)\n\n## Safety concerns\nUse the in-app Report tool for the fastest response. For emergencies call 911.`,
  },
];
