import React from 'react';

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "CareerPilot",
    "alternateName": "Career Management Platform",
    "description": "ATS optimization, resume intelligence, job tracking, and Smart Interview Prep — your complete career management platform.",
    "url": "https://ai-resume-tracker-lake.vercel.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Person",
      "name": "Prithwish Karmakar"
    },
    "featureList": [
      "Resume Score & ATS Compatibility",
      "Job Application Tracking",
      "Resume Tailoring",
      "Smart Interview Prep",
      "Keyword Match Analysis",
      "Career Progress Dashboard"
    ],
    "screenshot": "https://ai-resume-tracker-lake.vercel.app/api/og"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
