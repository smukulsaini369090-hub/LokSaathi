/**
 * Bilingual (Hindi + English) Legal, Terms of Use, Anti-Dalal Civic Safeguards,
 * and DPDP Act 2023 Privacy Transparency Content for LokSaathi.
 * Written in plain, respectful, everyday language for Indian citizens.
 */

export interface LegalSection {
  id: string;
  title: string;
  points: string[];
}

export const TERMS_CONTENT: Record<
  "hi" | "en",
  {
    badge: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
    audioSummary: string;
    sections: LegalSection[];
    fraudCalloutTitle: string;
    fraudCalloutBody: string;
    grievanceTitle: string;
    grievanceBody: string;
  }
> = {
  hi: {
    badge: "नागरिक उपयोग नियम",
    title: "नियम एवं शर्तें (Terms & Conditions)",
    subtitle:
      "लोकसाथी का उपयोग करने से जुड़ी सीधी, सरल और पारदर्शी जानकारी — बिना किसी कठिन कानूनी भाषा के।",
    lastUpdated: "अंतिम अद्यतन: नवंबर 2026",
    audioSummary:
      "लोकसाथी एक स्वतंत्र और पूरी तरह निःशुल्क नागरिक सहायता ऐप है, यह कोई सरकारी विभाग नहीं है। योजना की अंतिम पात्रता और आवेदन हमेशा आधिकारिक .gov.in वेबसाइट या सरकारी केंद्र पर ही जांचें। किसी दलाल को अवैध पैसे या ओटीपी न दें।",
    sections: [
      {
        id: "non-affiliation",
        title: "1. स्वतंत्र नागरिक सहायता मंच (कोई सरकारी वेबसाइट नहीं)",
        points: [
          "लोकसाथी (LokSaathi) आम नागरिकों की मदद के लिए बनाया गया एक स्वतंत्र डिजिटल सहायक उपकरण है। यह भारत सरकार या किसी राज्य सरकार (दिल्ली, हरियाणा, उत्तर प्रदेश, पंजाब) का आधिकारिक विभाग या पोर्टल नहीं है।",
          "सभी 519 योजनाएं और नियम आधिकारिक सरकारी पोर्टलों (.gov.in / .nic.in) तथा गजट अधिसूचनाओं से संकलित किए गए हैं।",
          "आवेदन करने से पहले कृपया हमेशा संबंधित आधिकारिक सरकारी वेबसाइट या नजदीकी CFC / अंत्योदय सरल केंद्र / जन सेवा केंद्र / सेवा केंद्र (CSC) पर अंतिम शर्तें व आवेदन तिथि सत्यापित करें।",
        ],
      },
      {
        id: "no-guarantee",
        title: "2. केवल सूचनात्मक मार्गदर्शन — स्वीकृति की गारंटी नहीं",
        points: [
          "लोकसाथी की पात्रता जांच (Pass / Fail / Missing) आपको सही योजना समझने और गलत फॉर्म से बचाने के लिए है।",
          "योजना की अंतिम स्वीकृति, पैसा मिलना या दस्तावेज़ सत्यापन केवल संबंधित सरकारी अधिकारी और विभाग के अधिकार क्षेत्र में होता है।",
        ],
      },
      {
        id: "zero-fee-anti-dalal",
        title: "3. ₹0 निःशुल्क सेवा और सख्त दलाल-विरोधी नियम",
        points: [
          "लोकसाथी का उपयोग सभी नागरिकों के लिए 100% निःशुल्क (₹0) है और हमेशा रहेगा। हम किसी योजना के लिए कोई आवेदन शुल्क या कमीशन नहीं लेते।",
          "कभी भी किसी अनजान व्यक्ति या दलाल को नकद पैसे, निजी UPI पेमेंट, आधार बायोमेट्रिक, बैंक PIN या OTP साझा न करें।",
          "सरकारी केंद्र (CSC / जन सेवा केंद्र) पर केवल सरकार द्वारा तय न्यूनतम शुल्क पर ही कार्य कराएं और पक्की रसीद (Acknowledgement Slip) ज़रूर लें।",
        ],
      },
      {
        id: "fair-use",
        title: "4. डेटा अद्यतन, उचित उपयोग और उत्तरदायित्व सीमा",
        points: [
          "सरकारी योजनाओं की आय सीमा, आयु नियम व बजट समय-समय पर बदलते रहते हैं। हम डेटा को नियमित अपडेट रखने का पूरा प्रयास करते हैं, परंतु किसी अप्रत्याशित सरकारी बदलाव के लिए लोकसाथी उत्तरदायी नहीं होगा।",
          "ऐप का उपयोग केवल वैध नागरिक सहायता के लिए करें। स्वचालित दुरुपयोग या फर्जी जानकारी फैलाना वर्जित है।",
        ],
      },
    ],
    fraudCalloutTitle: "फर्जी योजना या साइबर ठगी की रिपोर्ट कहाँ करें?",
    fraudCalloutBody:
      "यदि कोई व्यक्ति 'फ्री लैपटॉप', 'लड़की योजना' या 'पेंशन मंजूरी' के नाम पर पैसे या OTP मांगे, तो तुरंत राष्ट्रीय साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर शिकायत दर्ज करें।",
    grievanceTitle: "गलत नियम, टूटे लिंक या शिकायत की सूचना दें",
    grievanceBody:
      "यदि आपको किसी योजना की राशि, नियम या लिंक पुराना लगे, या भाषा/पहुँच (Accessibility) में सुधार का सुझाव हो, तो कृपया हमारे आधिकारिक GitHub रिपॉज़िटरी पर Issue दर्ज करें या अपनी स्थानीय ग्राम पंचायत / CSC हेल्पडेस्क से पोर्टल अधिसूचना मिलान कराएं।",
  },
  en: {
    badge: "Citizen Terms",
    title: "Terms & Conditions",
    subtitle:
      "Clear, everyday rules explaining what LokSaathi does, your safety protections, and official verification norms.",
    lastUpdated: "Last updated: November 2026",
    audioSummary:
      "LokSaathi is an independent, 100 percent free civic assistant, not a government website. Always verify final eligibility and submit applications strictly on official dot gov dot in portals or authorized facilitation centers. Never pay middlemen or share your OTP.",
    sections: [
      {
        id: "non-affiliation",
        title: "1. Independent Civic Platform (Non-Government Affiliation)",
        points: [
          "LokSaathi is an independent, non-profit-minded citizen-assistive tool. It is NOT an official portal or department of the Government of India or the State Governments of Delhi, Haryana, Uttar Pradesh, or Punjab.",
          "All 519 indexed welfare schemes and rules are compiled from public official portals (.gov.in / .nic.in) and government notifications.",
          "Before submitting any application, always verify the latest circular, active window, and portal link on the official government site or authorized center (CFC, Antyodaya Saral Kendra, Jan Seva Kendra, Sewa Kendra, or CSC).",
        ],
      },
      {
        id: "no-guarantee",
        title: "2. Informational Guidance Only — No Sanction Guarantee",
        points: [
          "LokSaathi's eligibility audit helps citizens avoid mismatched forms and NCR cross-border rejections before visiting a center.",
          "Final document verification, sanction, and Direct Benefit Transfer (DBT) approval rest exclusively with the designated government authority.",
        ],
      },
      {
        id: "zero-fee-anti-dalal",
        title: "3. Permanent ₹0 Access & Zero-Middleman Safeguard",
        points: [
          "Core LokSaathi guidance is permanently free (₹0). LokSaathi never charges fees, subscriptions, or commissions.",
          "Never pay touts/middlemen (dalals), transfer money to personal UPI IDs, or share Aadhaar OTPs, bank PINs, or biometrics with strangers.",
          "When using an authorized kiosk (CSC / Jan Seva Kendra), pay only the prescribed statutory facilitation fee and always collect an official printed acknowledgement receipt.",
        ],
      },
      {
        id: "fair-use",
        title: "4. Fair Use, Rule Freshness & Limitation of Liability",
        points: [
          "Welfare income caps, deadlines, and budgets evolve through new government circulars. While LokSaathi works diligently to keep rules verified, LokSaathi assumes no liability for sudden policy revisions or third-party government portal downtime.",
          "Use LokSaathi lawfully for citizen assistance; automated scraping abuse or scam impersonation is prohibited.",
        ],
      },
    ],
    fraudCalloutTitle: "Where to Report Scam Calls or Fake Scheme Links?",
    fraudCalloutBody:
      "If anyone demands money, UPI transfers, or OTPs promising guaranteed scheme sanction, call the National Cyber Crime Helpline at 1930 immediately or report on cybercrime.gov.in.",
    grievanceTitle: "Report Outdated Rules, Broken Links & Accessibility Issues",
    grievanceBody:
      "Spotted an outdated slab, dead official link, or translation/accessibility barrier? Report it cleanly via the official LokSaathi repository issue tracker or cross-check directly with your district e-District / CSC helpdesk.",
  },
};

export const PRIVACY_CONTENT: Record<
  "hi" | "en",
  {
    badge: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
    audioSummary: string;
    sections: LegalSection[];
    eraseTitle: string;
    eraseSubtitle: string;
    eraseButton: string;
    eraseDone: string;
  }
> = {
  hi: {
    badge: "DPDP 2023 गोपनीयता",
    title: "गोपनीयता सूचना (Privacy Notice)",
    subtitle:
      "आपकी पहचान, आधार और दस्तावेज़ पूरी तरह आपके फोन पर ही सुरक्षित रहते हैं — कोई लॉगिन या सरकारी/निजी डेटाबेस नहीं।",
    lastUpdated: "अंतिम अद्यतन: नवंबर 2026 • DPDP Act 2023 अनुरूप",
    audioSummary:
      "लोकसाथी कोई लॉगिन नहीं मांगता और आपका आधार, पैन, राशन कार्ड या बैंक खाता नंबर कभी सर्वर पर सेव नहीं करता। आप एक टैप में अपने फोन से सारा सहेजा गया डेटा तुरंत मिटा सकते हैं।",
    sections: [
      {
        id: "no-server-db",
        title: "1. कोई सर्वर डेटाबेस या अकाउंट नहीं (Zero Personal Database)",
        points: [
          "लोकसाथी आपसे कभी नाम, लॉगिन पासवर्ड, आधार नंबर, पैन, राशन कार्ड या बैंक खाता नंबर नहीं मांगता और न ही किसी सर्वर डेटाबेस में सेव करता है।",
          "519 योजनाओं की खोज और पात्रता मिलान मुख्य रूप से आपके डिवाइस और हमारे नियम-इंजन पर बिना ट्रैकिंग कुकीज़ के चलता है।",
        ],
      },
      {
        id: "pii-firewall",
        title: "2. आधार/पैन सुरक्षा ब्रश व DPDP PII फ़ायरवॉल (scrubCitizenPII)",
        points: [
          "दस्तावेज़ स्कैनर (/document) में फोटो अपलोड होने से पहले ही आपके ब्राउज़र कैनवास पर उंगली से काली पट्टी खींचकर आधार या निजी अंक स्थायी रूप से मिटाए जाते हैं।",
          "वॉयस व चैट सहायक में यदि कोई नागरिक गलती से 12-अंकीय आधार, पैन, बैंक खाता, मोबाइल नंबर या UPI लिख भी दे, तो किसी बाहरी AI सेवा तक जाने से पहले हमारा scrubCitizenPII() फ़ायरवॉल उसे [REDACTED] में बदल देता है।",
        ],
      },
      {
        id: "permissions-transparency",
        title: "3. माइक, लोकेशन और ऑफ़लाइन स्टोरेज (पूरी तरह आपकी मर्ज़ी)",
        points: [
          "माइक और लोकेशन तभी मांगे जाते हैं जब आप स्वयं 'अनुमति दें' दबाते हैं। हम कभी आपकी GPS लोकेशन सर्वर पर सेव नहीं करते।",
          "यदि आप 'अभी नहीं' चुनते हैं, तब भी त्वरित बटन (चिप्स), टेक्स्ट सर्च और ऑफ़लाइन सहेजी योजनाएं 100% काम करती हैं।",
        ],
      },
      {
        id: "local-storage",
        title: "4. आपके फोन में क्या सहेजा जाता है और कैसे मिटाएं?",
        points: [
          "केवल आपकी चुनी गई भाषा, अनुमति प्राथमिकताएं, सामान्य प्रोफ़ाइल (राज्य/आयु/पेशा/आय वर्ग — बिना नाम/आधार के), रसीद चेकलिस्ट और ऑफ़लाइन सहेजी योजनाएं (localStorage / IndexedDB) आपके अपने फोन में रहती हैं।",
          "DPDP Act 2023 के तहत आपको किसी भी समय नीचे दिए एक बटन से अपने डिवाइस से सारा लोकल डेटा तुरंत मिटाने का पूरा अधिकार है।",
        ],
      },
    ],
    eraseTitle: "DPDP डेटा हटाने का अधिकार (Right to Erasure)",
    eraseSubtitle:
      "नीचे दबाकर इस डिवाइस से अपनी सहेजी गई योजनाएं, प्रोफ़ाइल, अनुमति सेटिंग्स और चेकलिस्ट एक साथ मिटाएं:",
    eraseButton: "मेरा सारा लोकल डेटा अभी मिटाएं",
    eraseDone: "✅ इस डिवाइस से आपका सारा लोकल डेटा सुरक्षित रूप से मिटा दिया गया है।",
  },
  en: {
    badge: "DPDP 2023 Privacy",
    title: "Privacy & DPDP Notice",
    subtitle:
      "Your identity stays strictly on your phone. No accounts, no tracking profiles, and zero server storage of Aadhaar or documents.",
    lastUpdated: "Last updated: November 2026 • Aligned with India DPDP Act 2023",
    audioSummary:
      "LokSaathi never asks you to log in and never stores your Aadhaar, PAN, ration card, or bank numbers on any server. You can erase all locally saved data from your device in one tap.",
    sections: [
      {
        id: "no-server-db",
        title: "1. Zero Login & Zero Central Citizen Database",
        points: [
          "LokSaathi does not require user accounts, passwords, or Aadhaar login, and stores zero personal profiles on any server database.",
          "Direct 519-scheme discovery and deterministic eligibility audits run without ad trackers or behavioral profiling.",
        ],
      },
      {
        id: "pii-firewall",
        title: "2. Local Photo Redaction + Citizen PII Firewall (scrubCitizenPII)",
        points: [
          "In Document Helper (/document), sensitive regions you black out with your finger are permanently painted over inside your browser before image compression.",
          "In Voice/Chat intake, if a citizen accidentally types a 12-digit Aadhaar, PAN, bank account number, Indian phone number, or UPI ID, our scrubCitizenPII() firewall masks it locally before any external AI call.",
        ],
      },
      {
        id: "permissions-transparency",
        title: "3. Explicit Microphone, Location & Offline Preferences",
        points: [
          "Browser permissions are requested only when you explicitly tap 'Allow'. Raw GPS coordinates are never transmitted to or logged on LokSaathi servers.",
          "Choosing 'Not Now' keeps all typing, quick-tap state/category chips, and scheme lookups 100% functional.",
        ],
      },
      {
        id: "local-storage",
        title: "4. Device-Only Storage & Instant Erasure",
        points: [
          "Only non-identifying selections—chosen language, permission choices, non-PII eligibility range (state/age/occupation/income band), receipt checklists, and bookmarked schemes—are stored on your browser (localStorage / IndexedDB).",
          "In line with the Digital Personal Data Protection (DPDP) Act 2023, you can wipe all local data in one tap below or via Help (/help).",
        ],
      },
    ],
    eraseTitle: "DPDP Right to Erasure (Device Data Wipe)",
    eraseSubtitle:
      "Permanently erase saved profile answers, offline bookmarked schemes, receipt checklists, and permission settings from this browser:",
    eraseButton: "Erase All Local Data Now",
    eraseDone: "✅ All local LokSaathi data has been erased from this device.",
  },
};
