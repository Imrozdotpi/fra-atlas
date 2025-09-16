"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SiteFooter() {
  const { t, lang } = useLanguage();

  const logos = [
    {
      src: "/logos/LOGO-1.png",
      alt: "Emblem of India",
      url: "https://www.india.gov.in/",
    },
    {
      src: "/logos/LOGO-2.png",
      alt: "Ministry of Tribal Affairs",
      url: "https://tribal.nic.in/",
    },
    {
      src: "/logos/LOGO-3.jpg",
      alt: "Forest Survey of India",
      url: "https://fsi.nic.in/",
    },
    {
      src: "/logos/LOGO-4.jpg",
      alt: "NavIC ISRO",
      url: "https://www.isro.gov.in/",
    },
    {
      src: "/logos/LOGO-5.png",
      alt: "Digital India",
      url: "https://www.digitalindia.gov.in/",
    },
    {
      src: "/logos/LOGO-6.png",
      alt: "NIC",
      url: "https://www.nic.in/",
    },
  ];

  return (
    <>
      {/* Stakeholders Section */}
      <section className="py-12 bg-gov-green">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {t("stakeholders_title")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {logos.map((logo, i) => (
              <a
                key={i}
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                title={logo.alt}
                className="bg-white p-4 rounded-lg flex items-center justify-center h-24 hover:shadow-md transition"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-16 object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gov-blue text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{t("ministry_heading")}</h3>
              <p className="text-gray-300 mb-2">{t("address_line")}</p>

              {/* Ministry Website Link */}
              <a
                href="https://tribal.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-teal hover:underline"
              >
                {lang === "hi"
                  ? "जनजातीय कार्य मंत्रालय वेबसाइट देखें"
                  : "Visit Ministry of Tribal Affairs Website"}
              </a>
            </div>

            <div className="text-right">
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2">{t("toll_label")}</h4>
                <p className="text-2xl font-bold">{t("toll_number")}</p>
                <p className="text-gray-300">{t("contact_days")}</p>
                <p className="text-gray-300">{t("contact_hours")}</p>
              </div>
            </div>
          </div>

          {/* Extra Links Row */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <a href="/website-policy" className="hover:underline">
              {lang === "hi" ? "वेबसाइट नीति" : "Website Policy"}
            </a>
            <a href="/faq" className="hover:underline">
              {lang === "hi" ? "सामान्य प्रश्न" : "FAQ"}
            </a>
            <a href="/feedback" className="hover:underline">
              {lang === "hi" ? "प्रतिक्रिया" : "Feedback"}
            </a>
            <a href="/disclaimer" className="hover:underline">
              {lang === "hi" ? "अस्वीकरण" : "Disclaimer"}
            </a>
            <a href="/help" className="hover:underline">
              {lang === "hi" ? "सहायता" : "Help"}
            </a>
          </div>

          {/* Bottom copyright */}
          <div className="border-t border-gray-600 mt-6 pt-4 text-center text-gray-300">
            <p>{t("copyright")}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
