"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "en" | "hi";

interface LangContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * NOTE
 * - This file contains translations used across the app (Landing + Dashboard + Guidelines).
 * - Header/title strings are intentionally left out so the header remains literal.
 */
const translations: Record<string, { en: string; hi: string }> = {
  // --- Landing page / Quick cards / Officer section ---
  farmer_reg: { en: "Tribal Reg./Login", hi: "जनजातीय पंजीकरण/लॉगिन" },
  not_registered: { en: "Not yet Registered?", hi: "क्या अभी तक पंजीकृत नहीं?" },
  kisan_call_center: { en: "Tribal Call Center", hi: "जनजातीय कॉल सेंटर" },
  android_app: { en: "Android Mobile App", hi: "Android मोबाइल एप" },
  objective_title: { en: "Objective: Strengthening Tribal Welfare", hi: "उद्देश्य: जनजातीय कल्याण सशक्तिकरण" },
  objective_p1: {
    en:
      "The Ministry of Tribal Affairs is committed to conserving tribal heritage and improving the socioeconomic conditions of tribal communities across India.",
    hi:
      "जनजातीय कार्य मंत्रालय जनजातीय विरासत के संरक्षण तथा जनजातीय समुदायों की सामाजिक-आर्थिक स्थिति को सुधारने के लिए प्रतिबद्ध है।",
  },
  objective_p2: {
    en:
      "Through targeted schemes, capacity building, and partnerships with state governments and civil society, the Ministry works to empower tribal families while safeguarding their traditional knowledge and forests that are integral to their way of life.",
    hi:
      "लक्षित योजनाओं, क्षमता निर्माण और राज्य सरकारों तथा नागरिक समाज के साथ साझेदारी के माध्यम से मंत्रालय जनजातीय परिवारों को सशक्त बनाता है तथा उनके पारंपरिक ज्ञान और वनों की रक्षा करता है जो उनके जीवन का अभिन्न हिस्सा हैं।",
  },
  objective_p3: {
    en:
      "The Ministry also facilitates grievance redressal, promotes inclusive development, and monitors implementation to ensure that benefits reach the intended beneficiaries in a timely and transparent manner.",
    hi:
      "मंत्रालय शिकायत निवारण की सुविधा प्रदान करता है, समावेशी विकास को बढ़ावा देता है और यह सुनिश्चित करने के लिए कार्यन्वयन की निगरानी करता है कि लाभ समय पर और पारदर्शी तरीके से लक्षित लाभार्थियों तक पहुँचें।",
  },
  stakeholders_title: { en: "OUR STAKEHOLDERS", hi: "हमारे भागीदार" },

  // --- Footer ---
ministry_heading: {
  en: "MINISTRY OF TRIBAL AFFAIRS, GOVERNMENT OF INDIA",
  hi: "जनजातीय कार्य मंत्रालय, भारत सरकार",
},
address_line: {
  en: "416, 4th Floor, B-Wing, Ministry of Tribal Affairs, Shastri Bhawan, New Delhi-110001",
  hi: "416, 4th फ़्लोर, B-विंग, जनजातीय कार्य मंत्रालय, शास्त्री भवन, नई दिल्ली-110001",
},
toll_label: { en: "Phone Number", hi: "फोन नंबर" },
toll_number: { en: "011-23383303", hi: "011-23383303" },
contact_days: { en: "Monday to Friday", hi: "सोमवार से शुक्रवार" },
contact_hours: { en: "Time: 9:00AM - 5:00PM", hi: "समय: सुबह 9:00 बजे - शाम 5:00 बजे" },
copyright: {
  en: "Ministry of Tribal Affairs, Government of India © 2025 — All rights reserved",
  hi: "जनजातीय कार्य मंत्रालय, भारत सरकार © 2025 — सर्वाधिकार सुरक्षित",
},


  // --- Dashboard tabs & summary cards ---
  tab_area: { en: "Area-wise Land Details", hi: "क्षेत्र अनुसार भूमि विवरण" },
  tab_grievance: { en: "Grievance Details", hi: "शिकायत विवरण" },
  tab_panchayat: { en: "Panchayat Land Details", hi: "पंचायत भूमि विवरण" },

  total_villages: { en: "Total Villages", hi: "कुल गाँव" },
  villages: { en: "Villages", hi: "ग्राम" },
  cumulative_area: { en: "Cumulative Area (ha)", hi: "कुल क्षेत्रफल (हेक्टेयर)" },
  area_registered: { en: "Area Registered (ha)", hi: "पंजीकृत क्षेत्र (हेक्टेयर)" },
  farmers_registered: { en: "Farmers Registered", hi: "पंजीकृत किसान" },
  today_registered: { en: "Today's Registered (ha)", hi: "आज पंजीकृत (हेक्टेयर)" },
  todays_progress: { en: "Today's Progress", hi: "आज की प्रगति" },

  submitted: { en: "Submitted", hi: "सबमिट किए गए" },
  verified: { en: "Verified", hi: "सत्यापित" },
  "Submitted": { en: "Submitted", hi: "सबमिट किए गए" },
  "Verified": { en: "Verified", hi: "सत्यापित" },
  submitted_count_label: { en: "{n} submitted", hi: "{n} दावे सबमिट किए" },
  verified_count_label: { en: "{n} verified", hi: "{n} सत्यापित" },

  mismatch_area: { en: "Mismatch Area (ha)", hi: "असंगति क्षेत्र (हेक्टेयर)" },
  mismatch_analysis: { en: "Mismatch Analysis", hi: "असंगति विश्लेषण" },
  verified_mismatch: { en: "Verified Mismatch (ha)", hi: "सत्यापित असंगति (हेक्टेयर)" },
  pending_mismatch: { en: "Pending Mismatch (ha)", hi: "लंबित असंगति (हेक्टेयर)" },
  special_verification: { en: "Special Verification (ha)", hi: "विशेष सत्यापन (हेक्टेयर)" },
  special_verified: { en: "Special Verified (ha)", hi: "विशेष सत्यापित (हेक्टेयर)" },

  registration_progress: { en: "Registration Progress", hi: "पंजीकरण प्रगति" },
  registered_vs_remaining: { en: "Registered vs Remaining", hi: "पंजीकृत बनाम शेष" },
  hectares_registered_today: { en: "Hectares Registered Today", hi: "आज पंजीकृत हेक्टेयर" },
  of_total_area: { en: "of total area", hi: "कुल क्षेत्र का" },

  export_area: { en: "Export Area Data", hi: "क्षेत्र डेटा निर्यात करें" },
  export_grievance: { en: "Export Grievance Data", hi: "शिकायत डेटा निर्यात करें" },
  export_panchayat: { en: "Export Panchayat Data", hi: "पंचायत डेटा निर्यात करें" },

  total_grievances: { en: "Total Grievances", hi: "कुल शिकायतें" },
  solved: { en: "Solved", hi: "समाधान हो चुकी" },
  pending: { en: "Pending", hi: "लंबित" },
  pending_with_sdm: { en: "Pending with SDM", hi: "SDM के पास लंबित" },

  table_id: { en: "ID", hi: "आईडी" },
  table_raised_by: { en: "Raised By", hi: "द्वारा" },
  table_type: { en: "Type", hi: "प्रकार" },
  table_status: { en: "Status", hi: "स्थिति" },
  table_officer: { en: "Officer", hi: "अधिकारी" },
  table_date: { en: "Date", hi: "तारीख" },
  table_priority: { en: "Priority", hi: "प्राथमिकता" },

  grievance_details_title: { en: "Grievance Details - {id}", hi: "शिकायत विवरण - {id}" },
  raised_by: { en: "Raised By", hi: "द्वारा" },
  type: { en: "Type", hi: "प्रकार" },
  status: { en: "Status", hi: "स्थिति" },
  assigned_officer: { en: "Assigned Officer", hi: "नियुक्त अधिकारी" },
  description: { en: "Description", hi: "विवरण" },
  close: { en: "Close", hi: "बंद करें" },
  mark_as_solved: { en: "Mark as Solved", hi: "समाधान के रूप में चिह्नित करें" },
  escalate_to_sdm: { en: "Escalate to SDM", hi: "SDM को बढ़ाएँ" },

  panchayat_details_title: { en: "Panchayat Details - {district}", hi: "पंचायत विवरण - {district}" },
  total_villages_label: { en: "Total Villages", hi: "कुल गाँव" },
  claims_submitted: { en: "Claims Submitted", hi: "दावे सबमिट किए" },
  claims_verified: { en: "Claims Verified", hi: "सत्यापित दावे" },
  claims_pending: { en: "Claims Pending", hi: "लंबित दावे" },

  district_summary: { en: "District-wise Summary", hi: "ज़िला अनुसार सारांश" },
  table_district: { en: "District", hi: "ज़िला" },
  table_villages: { en: "Villages", hi: "ग्राम" },
  table_claims_submitted: { en: "Claims Submitted", hi: "दावे सबमिट किए" },
  table_claims_verified: { en: "Claims Verified", hi: "सत्यापित दावे" },
  table_claims_pending: { en: "Claims Pending", hi: "लंबित दावे" },

  panchayat_wise_breakdown: { en: "Panchayat-wise Breakdown", hi: "पंचायत अनुसार विवरण" },
  table_panchayat: { en: "Panchayat", hi: "पंचायत" },
  table_land_type: { en: "Land Type", hi: "भूमि प्रकार" },
  table_area: { en: "Area (ha)", hi: "क्षेत्र (हेक्टेयर)" },
  table_last_survey: { en: "Last Survey", hi: "अंतिम सर्वे" },

  upload_survey_documents: { en: "Upload Survey Documents", hi: "सर्वे दस्तावेज़ अपलोड करें" },
  download_report: { en: "Download Report", hi: "रिपोर्ट डाउनलोड करें" },

  claims_by_district: { en: "Claims by District", hi: "ज़िले द्वारा दावे" },
  total_claims_submitted: { en: "Total Claims Submitted", hi: "कुल दावे सबमिट" },
  across_n_districts: { en: "Across {n} Districts", hi: "{n} ज़िलों में" },
  overall_progress: { en: "Overall Progress", hi: "कुल प्रगति" },
  verification_rate: { en: "Verification Rate", hi: "सत्यापन दर" },
  verified_out_of_total: {
    en: "{verified} verified out of {total} claims",
    hi: "{total} में से {verified} सत्यापित",
  },

  notifications: { en: "Notifications", hi: "सूचनाएँ" },
  notification_bullet_1: {
    en: "New grievance submitted from Shivpuri district",
    hi: "शिवपुरी जिले से नई शिकायत प्राप्त",
  },
  notification_bullet_2: {
    en: "5 claims verified in Chhindwara today",
    hi: "आज छिंदवाड़ा में 5 दावे सत्यापित",
  },
  notification_bullet_3: {
    en: "Special verification pending for 3 cases",
    hi: "3 मामलों के लिए विशेष सत्यापन लंबित",
  },


   // --- Guidelines page ---
  guidelines_title: { en: "FRA Guidelines", hi: "FRA दिशानिर्देश" },
  guidelines_subtitle: { en: "Forest Rights Act - Complete Guide for Citizens", hi: "वन अधिकार अधिनियम - नागरिकों के लिए पूर्ण मार्गदर्शिका" },

  // Section 1: Introduction
  guidelines_intro_title: { en: "Introduction to FRA", hi: "FRA का परिचय" },
  guidelines_intro_text: {
    en: "The Forest Rights Act (FRA), 2006 recognizes and vests the forest rights and occupation in forest land in forest dwelling Scheduled Tribes and other traditional forest dwellers who have been residing in such forests for generations.",
    hi: "वनाधिकार अधिनियम (FRA), 2006 वन-निवासी अनुसूचित जनजातियों और अन्य परंपरागत वनवासियों के अधिकारों और वन भूमि में निवास को मान्यता देता है, जो पीढ़ियों से ऐसे वनों में रह रहे हैं।",
  },
  guidelines_eligible_beneficiaries: { en: "Eligible Beneficiaries:", hi: "पात्र लाभार्थी:" },
  guidelines_eligible_st: { en: "Scheduled Tribes (ST)", hi: "अनुसूचित जनजातियाँ (ST)" },
  guidelines_eligible_otfd: { en: "Other Traditional Forest Dwellers (OTFD) - residing for 3 generations (75 years)", hi: "अन्य परंपरागत वनवासी (OTFD) - 3 पीढ़ियों (75 वर्ष) से निवासरत" },

  // Section 2: Types of Rights
  guidelines_types_title: { en: "Types of Rights", hi: "अधिकारों के प्रकार" },
  guidelines_type_ifr: { en: "Individual Forest Rights (IFR)", hi: "व्यक्तिगत वन अधिकार (IFR)" },
  guidelines_type_ifr_desc: { en: "Rights to land for self-cultivation and habitation", hi: "स्वयं की खेती और निवास हेतु भूमि के अधिकार" },
  guidelines_type_cfr: { en: "Community Forest Rights (CFR)", hi: "सामुदायिक वन अधिकार (CFR)" },
  guidelines_type_cfr_desc: { en: "Rights over community forest resources", hi: "सामुदायिक वन संसाधनों पर अधिकार" },
  guidelines_type_other: { en: "Other Rights", hi: "अन्य अधिकार" },
  guidelines_type_other_desc: { en: "Grazing, fishing, forest produce collection", hi: "चराई, मत्स्य पालन, वन उपज संग्रह" },

  // Section 3: Eligibility
  guidelines_eligibility_title: { en: "Eligibility Criteria", hi: "पात्रता मानदंड" },
  guidelines_eligibility_residence: { en: "Residence Proof", hi: "निवास प्रमाण" },
  guidelines_eligibility_residence_desc: { en: "Must have been residing in forest land before 13th December 2005", hi: "13 दिसंबर 2005 से पहले वन भूमि में निवासरत होना चाहिए" },
  guidelines_eligibility_community: { en: "Community Belonging", hi: "समुदाय से संबंध" },
  guidelines_eligibility_community_desc: { en: "Must belong to Scheduled Tribes or Traditional Forest Dwellers (75 years)", hi: "अनुसूचित जनजाति या परंपरागत वनवासी (75 वर्ष) का होना अनिवार्य" },

  // Section 4: Documents Required
  guidelines_documents_title: { en: "Documents Required", hi: "आवश्यक दस्तावेज़" },
  guidelines_doc_residence: { en: "Residence proof documents", hi: "निवास प्रमाण दस्तावेज़" },
  guidelines_doc_landuse: { en: "Evidence of forest land use", hi: "वन भूमि उपयोग का प्रमाण" },
  guidelines_doc_resolution: { en: "Gram Sabha resolution", hi: "ग्राम सभा का प्रस्ताव" },
  guidelines_doc_verification: { en: "Community verification", hi: "समुदाय द्वारा सत्यापन" },

  // Section 5: Application Process
  guidelines_process_title: { en: "Application Process", hi: "आवेदन प्रक्रिया" },
  guidelines_process_step1: { en: "Gram Sabha", hi: "ग्राम सभा" },
  guidelines_process_step2: { en: "FRC", hi: "FRC" },
  guidelines_process_step3: { en: "SDLC", hi: "SDLC" },
  guidelines_process_step4: { en: "DLC", hi: "DLC" },

  // Section 6: How FRA Atlas Helps
  guidelines_help_title: { en: "How FRA Atlas Helps", hi: "FRA एटलस कैसे मदद करता है" },
  guidelines_help_upload: { en: "Upload & Track Claims", hi: "दावे अपलोड करें और ट्रैक करें" },
  guidelines_help_upload_desc: { en: "Digital submission and real-time tracking", hi: "डिजिटल सबमिशन और रियल-टाइम ट्रैकिंग" },
  guidelines_help_map: { en: "Interactive Map Visibility", hi: "इंटरैक्टिव मानचित्र दृश्यता" },
  guidelines_help_map_desc: { en: "Geospatial visualization of claims", hi: "दावों का भू-स्थानिक दृश्यांकन" },
  guidelines_help_transparency: { en: "Transparency & Accountability", hi: "पारदर्शिता और जवाबदेही" },
  guidelines_help_transparency_desc: { en: "Open process with clear timelines", hi: "स्पष्ट समयसीमा के साथ खुली प्रक्रिया" },
  guidelines_help_faster: { en: "Faster Claim Approvals", hi: "तेज़ दावे की स्वीकृति" },
  guidelines_help_faster_desc: { en: "Streamlined digital workflow", hi: "सरलीकृत डिजिटल कार्यप्रवाह" },

  // Section 7: Do’s & Don’ts
  guidelines_dos_title: { en: "Do's", hi: "क्या करें" },
  guidelines_dont_title: { en: "Don'ts", hi: "क्या न करें" },
  guidelines_dos_1: { en: "Provide correct and complete information", hi: "सही और पूर्ण जानकारी दें" },
  guidelines_dos_2: { en: "Participate actively in Gram Sabha meetings", hi: "ग्राम सभा बैठकों में सक्रिय रूप से भाग लें" },
  guidelines_dos_3: { en: "Regularly check application status", hi: "आवेदन की स्थिति नियमित रूप से जांचें" },
  guidelines_donts_1: { en: "Submit false or misleading claims", hi: "झूठे या भ्रामक दावे प्रस्तुत न करें" },
  guidelines_donts_2: { en: "Misuse forest resources", hi: "वन संसाधनों का दुरुपयोग न करें" },
  guidelines_donts_3: { en: "Overexploit natural resources", hi: "प्राकृतिक संसाधनों का अति-शोषण न करें" },

  // Section 8: Support & Contact
  guidelines_contact_title: { en: "Support & Contact", hi: "सहायता और संपर्क" },
  guidelines_contact_helpline: { en: "Toll-free Helpline", hi: "टोल-फ्री हेल्पलाइन" },
  guidelines_contact_hours: { en: "Monday to Friday, 9:00 AM - 5:00 PM", hi: "सोमवार से शुक्रवार, सुबह 9:00 बजे - शाम 5:00 बजे" },
  guidelines_contact_local: { en: "Local Support", hi: "स्थानीय सहायता" },
  guidelines_contact_office: { en: "Contact your nearest Tribal Welfare Office", hi: "अपने नज़दीकी जनजातीय कल्याण कार्यालय से संपर्क करें" },
  guidelines_contact_district: { en: "District Collector's Office", hi: "जिला कलेक्टर का कार्यालय" },
  guidelines_contact_faq: { en: "Frequently Asked Questions", hi: "अक्सर पूछे जाने वाले प्रश्न" },
  guidelines_contact_faq_note: {
    en: "For detailed FAQs and additional support, visit the Ministry of Tribal Affairs website or contact your local FRA implementation officer.",
    hi: "विस्तृत FAQs और अतिरिक्त सहायता के लिए, जनजातीय कार्य मंत्रालय की वेबसाइट देखें या अपने स्थानीय FRA क्रियान्वयन अधिकारी से संपर्क करें।",
  },

};

const LangContext = createContext<LangContext | undefined>(undefined);

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("site_lang");
      if (saved === "hi" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("site_lang", l);
    } catch {}
  };

  const t = (rawKey: string, vars?: Record<string, string | number>) => {
    if (!rawKey && rawKey !== "") return rawKey;

    const tryKeys = [
      rawKey,
      rawKey.trim(),
      rawKey.trim().toLowerCase(),
      toTitleCase(rawKey.trim()),
      rawKey.trim().replace(/\s+/g, "_"),
    ];

    let entry = null as { en: string; hi: string } | null;

    for (const k of tryKeys) {
      if (k in translations) {
        entry = translations[k];
        break;
      }
    }

    let text = entry ? (lang === "hi" ? entry.hi : entry.en) : rawKey;

    if (vars && typeof text === "string") {
      Object.keys(vars).forEach((k) => {
        const v = String(vars[k]);
        text = text.split(`{${k}}`).join(v);
      });
    }

    return text;
  };

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
