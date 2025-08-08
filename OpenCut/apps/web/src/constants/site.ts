export const SITE_URL = "https://genid.app";

export const SITE_INFO = {
  title: "genID powered by The Force",
  description:
    "AI-powered social media content generator that creates stunning posts with intelligent design.",
  url: SITE_URL,
  openGraphImage: "/open-graph/default.jpg",
  twitterImage: "/open-graph/default.jpg",
  favicon: "/favicon.ico",
};

export const EXTERNAL_TOOLS = [
  {
    name: "Marble",
    description:
      "Modern headless CMS for content management and the blog for genID",
    url: "https://marblecms.com?utm_source=genid",
    icon: "MarbleIcon" as const,
  },
  {
    name: "Vercel",
    description: "Platform where we deploy and host genID",
    url: "https://vercel.com?utm_source=genid",
    icon: "VercelIcon" as const,
  },
  {
    name: "Databuddy",
    description: "GDPR compliant analytics and user insights for genID",
    url: "https://databuddy.cc?utm_source=genid",
    icon: "DataBuddyIcon" as const,
  },
];
