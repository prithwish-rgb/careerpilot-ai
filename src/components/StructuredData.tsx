import React from 'react';

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ResumeIQ",
    "alternateName": "Intelligent Resume & Career Management Platform",
    "description": "ATS optimization, resume intelligence, job match analysis, application tracking, and optional AI tailoring — all at zero cost.",
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
      "ATS Resume Score",
      "Resume Health Check",
      "Job Match Analysis",
      "Skill Gap Detection",
      "Application Tracking",
      "Resume Tailoring",
      "Gmail Job Import",
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
