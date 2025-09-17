"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function WebsitePolicyPage() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gov-blue mb-6">
          {lang === "hi" ? "वेबसाइट नीति" : "Website Policy"}
        </h1>

        <p className="text-gray-700 mb-6 leading-relaxed">
          {lang === "hi"
            ? "यह वेबसाइट भारत सरकार, जनजातीय कार्य मंत्रालय द्वारा विकसित और अनुरक्षित की गई है। इस वेबसाइट का उद्देश्य पारदर्शिता, जिम्मेदारी और सुशासन को बढ़ावा देना है। यह नीति वेबसाइट के उपयोग, सामग्री, सुरक्षा और कॉपीराइट से संबंधित दिशा-निर्देश प्रदान करती है।"
            : "This website is developed and maintained by the Ministry of Tribal Affairs, Government of India. The objective of this website is to promote transparency, accountability, and good governance. This policy outlines the guidelines related to usage, content, security, and copyright of the website."}
        </p>

        {/* Ownership & Maintenance */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "स्वामित्व और रखरखाव" : "Ownership and Maintenance"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल का स्वामित्व और रखरखाव जनजातीय कार्य मंत्रालय, भारत सरकार द्वारा किया जाता है। तकनीकी सहयोग राष्ट्रीय सूचना विज्ञान केंद्र (NIC) द्वारा प्रदान किया जाता है।"
            : "The ownership and maintenance of this portal rests with the Ministry of Tribal Affairs, Government of India, with technical support from the National Informatics Centre (NIC)."}
        </p>

        {/* Accuracy of Information */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "जानकारी की सटीकता" : "Accuracy of Information"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस वेबसाइट पर उपलब्ध जानकारी विभागों और राज्यों द्वारा प्रदान की जाती है। यद्यपि हम यह सुनिश्चित करने का प्रयास करते हैं कि सामग्री सटीक और अद्यतन हो, लेकिन किसी भी त्रुटि या चूक के लिए मंत्रालय जिम्मेदार नहीं होगा।"
            : "The information available on this website is provided by concerned departments and states. While every effort is made to ensure accuracy and timeliness, the Ministry shall not be held responsible for any errors or omissions."}
        </p>

        {/* External Links */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "बाहरी लिंक" : "External Links"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल पर बाहरी वेबसाइटों के लिंक उपलब्ध कराए जा सकते हैं। मंत्रालय इन वेबसाइटों की सामग्री, उपलब्धता या विश्वसनीयता के लिए जिम्मेदार नहीं है।"
            : "This portal may provide links to external websites. The Ministry is not responsible for the content, availability, or reliability of such linked websites."}
        </p>

        {/* Security */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "सुरक्षा नीति" : "Security Policy"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल की सुरक्षा सुनिश्चित करने के लिए आवश्यक उपाय अपनाए गए हैं। अनधिकृत पहुंच, डेटा हेरफेर और हानिकारक गतिविधियों को रोकने के लिए NIC के मानक सुरक्षा प्रोटोकॉल लागू किए गए हैं।"
            : "Necessary measures have been adopted to ensure the security of this portal. Standard NIC security protocols have been implemented to prevent unauthorized access, data manipulation, and malicious activities."}
        </p>

        {/* Copyright */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "कॉपीराइट नीति" : "Copyright Policy"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल की सामग्री कॉपीराइट अधिनियम, 1957 के तहत संरक्षित है। सामग्री का उपयोग, पुनरुत्पादन या पुनर्प्रकाशन मंत्रालय की पूर्व अनुमति के बिना नहीं किया जा सकता। उचित श्रेय देना अनिवार्य है।"
            : "The content of this portal is protected under the Copyright Act, 1957. No part of the content may be used, reproduced, or republished without prior permission of the Ministry. Proper attribution must be given in all cases."}
        </p>

        {/* Privacy */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "गोपनीयता नीति" : "Privacy Policy"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल पर विज़िट करने से कोई व्यक्तिगत जानकारी संग्रहित नहीं की जाती जब तक कि उपयोगकर्ता स्वयं इसे प्रदान न करे। प्रदान की गई जानकारी का उपयोग केवल आधिकारिक उद्देश्यों के लिए किया जाएगा और इसे किसी तीसरे पक्ष के साथ साझा नहीं किया जाएगा।"
            : "This portal does not collect any personal information when you visit unless you choose to provide it. Any information provided will be used only for official purposes and will not be shared with third parties."}
        </p>

        {/* Terms of Use */}
        <h2 className="text-xl font-semibold text-gov-green mt-6 mb-2">
          {lang === "hi" ? "उपयोग की शर्तें" : "Terms of Use"}
        </h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          {lang === "hi"
            ? "इस पोर्टल का उपयोग करके, उपयोगकर्ता सहमत होता है कि वह इस नीति का पालन करेगा और किसी भी अनधिकृत गतिविधि में संलग्न नहीं होगा।"
            : "By using this portal, the user agrees to abide by this policy and refrain from engaging in any unauthorized activities."}
        </p>
      </div>
    </div>
  );
}
