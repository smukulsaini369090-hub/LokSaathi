/**
 * State-Aware "Document Kaise Banwayein?" (How to Get It?) Knowledge Registry.
 * Verified official portals, procedures, and offline options for Central,
 * Delhi, Haryana, Uttar Pradesh, and Punjab.
 */

export interface DocumentAcquisitionGuide {
  id: string;
  name: { hi: string; en: string };
  category: "income" | "residence" | "caste_ews" | "ration_ppp" | "banking_dbt" | "land" | "disability_vital" | "identity";
  portal_name: { hi: string; en: string };
  portal_url: string;
  offline_option: { hi: string; en: string };
  base_documents: { hi: string[]; en: string[] };
  estimated_days: { hi: string; en: string };
  steps: { hi: string[]; en: string[] };
  important_note?: { hi: string; en: string };
  official_fee?: { hi: string; en: string };
  anti_dalal_tip?: { hi: string; en: string };
}

export type SupportedState = "delhi" | "haryana" | "up" | "punjab" | "central";

// 1. Income Certificate Guides
const INCOME_GUIDES: Record<SupportedState, DocumentAcquisitionGuide> = {
  delhi: {
    id: "income-cert-delhi",
    name: { hi: "आय प्रमाण पत्र (Income Certificate)", en: "Income Certificate (Delhi)" },
    category: "income",
    portal_name: { hi: "ई-डिस्ट्रिक्ट दिल्ली पोर्टल", en: "e-District Delhi Portal" },
    portal_url: "https://edistrict.delhigovt.nic.in",
    offline_option: { hi: "निकटतम एसडीएम (SDM) कार्यालय या नागरिक सुविधा केंद्र", en: "Nearest SDM Office or Citizen Facilitation Center" },
    base_documents: {
      hi: ["पहचान प्रमाण (आधार कार्ड / वोटर आईडी)", "दिल्ली निवास प्रमाण पत्र", "वेतन पर्ची या आय का स्व-घोषणा पत्र", "पासपोर्ट साइज फोटो"],
      en: ["Identity proof (Aadhaar / Voter ID)", "Delhi residence proof", "Salary slip or self-declaration of income", "Passport size photograph"],
    },
    estimated_days: { hi: "7 से 14 कार्य दिवस", en: "7 to 14 working days" },
    steps: {
      hi: [
        "edistrict.delhigovt.nic.in पर जाकर 'Citizen Registration' करें।",
        "'Apply for Services' में जाकर 'Revenue Department' -> 'Issuance of Income Certificate' चुनें।",
        "पारिवारिक वार्षिक आय विवरण भरें और आधार व स्व-घोषणा पत्र अपलोड करें।",
        "आवेदन जमा कर पावती (Acknowledgement Slip) डाउनलोड करें।",
      ],
      en: [
        "Register as a citizen on edistrict.delhigovt.nic.in.",
        "Select 'Revenue Department' -> 'Issuance of Income Certificate' under Apply for Services.",
        "Fill family annual income details and upload Aadhaar and self-declaration affidavit.",
        "Submit and download the acknowledgement slip for SDM verification tracking.",
      ],
    },
    important_note: {
      hi: "दिल्ली में प्रमाण पत्र 6 महीने के लिए वैध होता है।",
      en: "In Delhi, the certificate remains valid for 6 months from issue date.",
    },
  },
  haryana: {
    id: "income-cert-haryana",
    name: { hi: "आय प्रमाण पत्र (Income Certificate - Haryana)", en: "Income Certificate (Haryana)" },
    category: "income",
    portal_name: { hi: "सरल हरियाणा पोर्टल (Saral Haryana)", en: "Antyodaya Saral Haryana Portal" },
    portal_url: "https://saralharyana.gov.in",
    offline_option: { hi: "निकटतम सरल केंद्र या अंत्योदय सेवा केंद्र", en: "Nearest Saral Kendra or Antyodaya Kendra" },
    base_documents: {
      hi: ["परिवार पहचान पत्र (PPP - Family ID अनिवार्य)", "आधार कार्ड", "बैंक खाता विवरण", "स्व-घोषणा पत्र"],
      en: ["Parivar Pehchan Patra (PPP Family ID mandatory)", "Aadhaar Card", "Bank account statement", "Self declaration"],
    },
    estimated_days: { hi: "3 से 7 कार्य दिवस", en: "3 to 7 working days" },
    steps: {
      hi: [
        "saralharyana.gov.in पर लॉगिन करें (या नजदीकी सरल केंद्र जाएं)।",
        "अपनी परिवार पहचान पत्र (Family ID) दर्ज करें और OTP से सत्यापित करें।",
        "PPP में सत्यापित आय के आधार पर 'Income Certificate' के लिए आवेदन सबमिट करें।",
        "सत्यापन पूर्ण होते ही डिजिटल हस्ताक्षरित प्रमाण पत्र डाउनलोड करें।",
      ],
      en: [
        "Log in to saralharyana.gov.in or visit your nearest Saral Kendra.",
        "Enter your Family ID (PPP) and verify via mobile OTP.",
        "Submit request for Income Certificate based on PPP verified income.",
        "Download the digitally signed certificate upon automated verification.",
      ],
    },
    important_note: {
      hi: "हरियाणा में परिवार पहचान पत्र (PPP) में आय सत्यापित होना आवश्यक है।",
      en: "Income must first be verified in Haryana Parivar Pehchan Patra (PPP).",
    },
  },
  up: {
    id: "income-cert-up",
    name: { hi: "आय प्रमाण पत्र (Income Certificate - UP)", en: "Income Certificate (Uttar Pradesh)" },
    category: "income",
    portal_name: { hi: "ई-साथी उत्तर प्रदेश (e-Sathi UP)", en: "e-Sathi UP Portal" },
    portal_url: "https://esathi.up.gov.in",
    offline_option: { hi: "निकटतम सीएससी जन सेवा केंद्र या तहसील कार्यालय", en: "Nearest CSC Jan Seva Kendra or Tehsil Office" },
    base_documents: {
      hi: ["आधार कार्ड", "राशन कार्ड की छायाप्रति", "स्वप्रमाणित घोषणा पत्र", "पासपोर्ट साइज रंगीन फोटो"],
      en: ["Aadhaar Card", "Ration Card copy", "Self-attested declaration", "Passport size photograph"],
    },
    estimated_days: { hi: "7 से 15 कार्य दिवस", en: "7 to 15 working days" },
    steps: {
      hi: [
        "esathi.up.gov.in पर 'नवीन उपयोगकर्ता पंजीकरण' करें।",
        "आवेदन पत्र में 'आय प्रमाण पत्र' चुनें और परिवार के सदस्यों का विवरण भरें।",
        "लेखपाल जांच हेतु संबंधित तहसील व ग्राम/वार्ड का चयन करें।",
        "मात्र ₹15 का सरकारी शुल्क ऑनलाइन भुगतान कर रसीद प्राप्त करें।",
      ],
      en: [
        "Register as a new user on esathi.up.gov.in.",
        "Select 'Income Certificate' from Revenue Services and fill household details.",
        "Choose your Tehsil and village/ward for Lekhpal field inquiry.",
        "Pay the nominal ₹15 government fee online and retain your application number.",
      ],
    },
    important_note: {
      hi: "उत्तर प्रदेश में आय प्रमाण पत्र 3 वर्ष के लिए मान्य होता है।",
      en: "In Uttar Pradesh, the income certificate remains valid for 3 years.",
    },
  },
  punjab: {
    id: "income-cert-punjab",
    name: { hi: "आय प्रमाण पत्र (Income Certificate - Punjab)", en: "Income Certificate (Punjab)" },
    category: "income",
    portal_name: { hi: "ई-सेवा पंजाब पोर्टल", en: "e-Services Punjab / Sewa Kendra" },
    portal_url: "https://eservices.punjab.gov.in",
    offline_option: { hi: "निकटतम सेवा केंद्र (Sewa Kendra) या तहसील सुविधा केंद्र", en: "Nearest Sewa Kendra or Tehsil Suvidha Center" },
    base_documents: {
      hi: ["आधार कार्ड", "पंजाब निवास प्रमाण पत्र", "पटवारी / सरपंच द्वारा सत्यापित आय रिपोर्ट", "पासपोर्ट साइज फोटो"],
      en: ["Aadhaar Card", "Punjab Residence Certificate", "Patwari / Sarpanch verified income report", "Passport photograph"],
    },
    estimated_days: { hi: "7 से 10 कार्य दिवस", en: "7 to 10 working days" },
    steps: {
      hi: [
        "eservices.punjab.gov.in पर जाएं या नजदीकी सेवा केंद्र में टोकन लें।",
        "पटवारी से अपनी कृषि/गैर-कृषि आय की जांच रिपोर्ट प्राप्त करें।",
        "फॉर्म भरें और सेवा केंद्र में बायोमेट्रिक सत्यापन कराएं।",
        "एसडीएम / तहसीलदार के डिजिटल हस्ताक्षर के बाद प्रमाण पत्र प्राप्त करें।",
      ],
      en: [
        "Visit eservices.punjab.gov.in or visit your local Sewa Kendra.",
        "Obtain verification report from the local Patwari for agricultural/wage income.",
        "Submit application with biometric verification at the Sewa Kendra counter.",
        "Collect the digitally signed certificate approved by the Tehsildar.",
      ],
    },
  },
  central: {
    id: "income-cert-central",
    name: { hi: "आय प्रमाण पत्र (Income Certificate)", en: "Income Certificate (General / Central)" },
    category: "income",
    portal_name: { hi: "राज्य ई-डिस्ट्रिक्ट पोर्टल या डिजिटल सेवा (CSC)", en: "State e-District Portal or CSC Digital Seva" },
    portal_url: "https://digitalseva.csc.gov.in",
    offline_option: { hi: "तहसीलदार कार्यालय या नजदीकी सीएससी जन सेवा केंद्र", en: "Tehsildar / Taluk Office or nearest CSC Center" },
    base_documents: {
      hi: ["पहचान पत्र (आधार कार्ड)", "निवास प्रमाण", "आय का स्व-घोषणा पत्र / बैंक पासबुक", "पासपोर्ट फोटो"],
      en: ["Identity proof (Aadhaar)", "Address proof", "Income self-declaration / Bank statement", "Passport photo"],
    },
    estimated_days: { hi: "10 से 15 कार्य दिवस", en: "10 to 15 working days" },
    steps: {
      hi: [
        "अपने राज्य के आधिकारिक ई-डिस्ट्रिक्ट पोर्टल पर जाएं या निकटतम सीएससी केंद्र पहुंचें।",
        "आय प्रमाण पत्र का आवेदन फॉर्म भरकर परिवार की कुल आय दर्ज करें।",
        "आवश्यक दस्तावेज संलग्न करें और राजस्व निरीक्षक द्वारा सत्यापन करवाएं।",
      ],
      en: [
        "Visit your state e-District portal or nearest Common Service Center (CSC).",
        "Submit income certificate application with family financial details.",
        "Revenue officer verifies records and issues digitally signed certificate.",
      ],
    },
  },
};

// 2. Domicile / Residence Certificate Guides
const RESIDENCE_GUIDES: Record<SupportedState, DocumentAcquisitionGuide> = {
  delhi: {
    id: "residence-cert-delhi",
    name: { hi: "दिल्ली निवास प्रमाण पत्र (Delhi Domicile Certificate)", en: "Delhi Residence Certificate" },
    category: "residence",
    portal_name: { hi: "ई-डिस्ट्रिक्ट दिल्ली", en: "e-District Delhi" },
    portal_url: "https://edistrict.delhigovt.nic.in",
    offline_option: { hi: "एसडीएम कार्यालय या सीएससी केंद्र", en: "SDM Office or CSC Center" },
    base_documents: {
      hi: ["पिछले 3 वर्षों से दिल्ली में रहने का प्रमाण (बिजली बिल / पानी बिल / वोटर कार्ड / किरायानामा)", "आधार कार्ड", "पासपोर्ट फोटो"],
      en: ["Proof of 3 years stay in Delhi (Electricity/Water bill, Voter ID, Rent agreement)", "Aadhaar Card", "Photograph"],
    },
    estimated_days: { hi: "14 कार्य दिवस", en: "14 working days" },
    steps: {
      hi: [
        "edistrict.delhigovt.nic.in पर 'Domicile Certificate' के लिए आवेदन करें।",
        "दिल्ली में 3 साल के निवास का निरंतर दस्तावेजी साक्ष्य अपलोड करें।",
        "स्थानीय जांच के बाद ऑनलाइन प्रमाण पत्र डाउनलोड करें।",
      ],
      en: [
        "Apply for 'Domicile Certificate' on edistrict.delhigovt.nic.in.",
        "Upload continuous 3-year proof of residence in Delhi.",
        "Download certified document after field verification.",
      ],
    },
  },
  haryana: {
    id: "residence-cert-haryana",
    name: { hi: "हरियाणा मूल निवास प्रमाण पत्र (Haryana Resident Certificate)", en: "Haryana Domicile Certificate" },
    category: "residence",
    portal_name: { hi: "सरल हरियाणा (Saral Haryana)", en: "Saral Haryana" },
    portal_url: "https://saralharyana.gov.in",
    offline_option: { hi: "सरल केंद्र / अंत्योदय केंद्र", en: "Saral Kendra / Antyodaya Kendra" },
    base_documents: {
      hi: ["परिवार पहचान पत्र (PPP)", "आधार कार्ड", "हरियाणा में 15 वर्ष के निवास का प्रमाण / 10वीं मार्कशीट", "फोटो"],
      en: ["Parivar Pehchan Patra (PPP)", "Aadhaar Card", "Proof of 15 years stay in Haryana / 10th marksheet", "Photo"],
    },
    estimated_days: { hi: "7 कार्य दिवस", en: "7 working days" },
    steps: {
      hi: [
        "saralharyana.gov.in पर PPP आईडी से लॉगिन करें।",
        "'Resident Certificate' विकल्प चुनकर आवेदन सबमिट करें।",
      ],
      en: ["Login via PPP on saralharyana.gov.in and apply for Resident Certificate."],
    },
  },
  up: {
    id: "residence-cert-up",
    name: { hi: "निवास प्रमाण पत्र (UP Domicile / Niwas Praman Patra)", en: "UP Domicile Certificate" },
    category: "residence",
    portal_name: { hi: "ई-साथी उत्तर प्रदेश", en: "e-Sathi UP" },
    portal_url: "https://esathi.up.gov.in",
    offline_option: { hi: "जन सेवा केंद्र (CSC) या तहसील", en: "Jan Seva Kendra (CSC) or Tehsil" },
    base_documents: {
      hi: ["आधार कार्ड", "निवास का प्रमाण (बिजली बिल / वोटर कार्ड / राशन कार्ड)", "स्वप्रमाणित घोषणा पत्र", "पासपोर्ट फोटो"],
      en: ["Aadhaar Card", "Address proof (Electricity bill / Voter ID / Ration card)", "Self-declaration", "Photo"],
    },
    estimated_days: { hi: "10 से 15 कार्य दिवस", en: "10 to 15 working days" },
    steps: {
      hi: [
        "esathi.up.gov.in पर 'निवास प्रमाण पत्र' का चयन करें।",
        "ग्राम/तहसील चुनें और लेखपाल सत्यापन हेतु आवश्यक कागजात संलग्न करें।",
      ],
      en: ["Select Domicile Certificate on esathi.up.gov.in and submit for Lekhpal verification."],
    },
  },
  punjab: {
    id: "residence-cert-punjab",
    name: { hi: "पंजाब निवास प्रमाण पत्र (Punjab Residence Certificate)", en: "Punjab Residence Certificate" },
    category: "residence",
    portal_name: { hi: "ई-सेवा पंजाब", en: "e-Services Punjab" },
    portal_url: "https://eservices.punjab.gov.in",
    offline_option: { hi: "सेवा केंद्र (Sewa Kendra)", en: "Sewa Kendra" },
    base_documents: {
      hi: ["आधार कार्ड", "5 वर्ष का पंजाब निवास साक्ष्य (वोटर कार्ड / रजिस्ट्री / बिजली बिल)", "पासपोर्ट फोटो"],
      en: ["Aadhaar Card", "5 years proof of stay in Punjab", "Passport photo"],
    },
    estimated_days: { hi: "7 से 10 कार्य दिवस", en: "7 to 10 working days" },
    steps: {
      hi: [
        "सेवा केंद्र जाकर निवास प्रमाण पत्र का फॉर्म भरें।",
        "पटवारी सत्यापन और बायोमेट्रिक रिकॉर्डिंग पूर्ण कराएं।",
      ],
      en: ["Submit application at Sewa Kendra with Patwari verification report."],
    },
  },
  central: {
    id: "residence-cert-central",
    name: { hi: "मूल निवास प्रमाण पत्र (Domicile / Residence Certificate)", en: "Domicile / Residence Certificate" },
    category: "residence",
    portal_name: { hi: "राज्य ई-डिस्ट्रिक्ट पोर्टल", en: "State e-District Portal" },
    portal_url: "https://services.india.gov.in",
    offline_option: { hi: "तहसीलदार कार्यालय / सीएससी केंद्र", en: "Tehsildar Office / CSC Center" },
    base_documents: {
      hi: ["आधार कार्ड", "निवास का साक्ष्य", "पासपोर्ट फोटो"],
      en: ["Aadhaar Card", "Proof of Residence", "Photo"],
    },
    estimated_days: { hi: "10 से 14 कार्य दिवस", en: "10 to 14 working days" },
    steps: {
      hi: ["राज्य के ई-डिस्ट्रिक्ट पोर्टल या तहसील से आवेदन करें।"],
      en: ["Apply through the respective state e-District portal or Tehsildar office."],
    },
  },
};

// 3. Bank Account Aadhaar Seeding / DBT Mandate Guide
const DBT_BANKING_GUIDE: DocumentAcquisitionGuide = {
  id: "dbt-aadhaar-seeding",
  name: { hi: "बैंक खाता आधार सीडिंग / डीबीटी सक्रियण (Aadhaar DBT Seeding)", en: "Bank Account Aadhaar DBT Seeding" },
  category: "banking_dbt",
  portal_name: { hi: "एनपीसीआई आधार मैपर / इंडिया पोस्ट पेमेंट्स बैंक", en: "NPCI Aadhaar Mapper / IPPB Portal" },
  portal_url: "https://www.npci.org.in",
  offline_option: { hi: "अपनी बैंक शाखा या निकटतम डाकघर (India Post Payments Bank)", en: "Your bank branch or nearest Post Office (IPPB)" },
  base_documents: {
    hi: ["आधार कार्ड की मूल व छायाप्रति", "बैंक पासबुक", "मोबाइल नंबर (जो आधार से जुड़ा हो)"],
    en: ["Aadhaar original and photocopy", "Bank passbook", "Registered mobile number"],
  },
  estimated_days: { hi: "24 से 48 घंटे", en: "24 to 48 hours" },
  steps: {
    hi: [
      "अपनी बैंक शाखा जाएं और 'Aadhaar DBT Seeding / Mandate Form' मांगें।",
      "फॉर्म में अपना बैंक खाता और आधार नंबर भरकर हस्ताक्षर करें।",
      "शाखा अधिकारी द्वारा बायोमेट्रिक या OTP सत्यापन करवाएं।",
      "सक्रिय होने के बाद myaadhaar.uidai.gov.in पर 'Bank Seeding Status' चेक करें।",
      "त्वरित विकल्प: यदि मुख्य बैंक में देरी हो, तो डाकघर जाकर 10 मिनट में IPPB खाता खुलवाएं जिसमें DBT तुरंत सक्रिय होता है।",
    ],
    en: [
      "Visit your bank branch and ask for the Aadhaar DBT Seeding Mandate Form.",
      "Fill your account number, Aadhaar number, and sign the consent.",
      "Bank official performs biometric or OTP authentication.",
      "Verify activation at myaadhaar.uidai.gov.in under 'Bank Seeding Status'.",
      "Instant alternative: Open an IPPB account at your local Post Office where DBT is enabled immediately.",
    ],
  },
  important_note: {
    hi: "केवल आधार लिंक होना पर्याप्त नहीं है; डीबीटी (DBT) के लिए NPCI मैपर पर सीड होना आवश्यक है।",
    en: "Simple Aadhaar linking is not enough; DBT mandate must be mapped to NPCI for government funds.",
  },
};

// 4. Land Records / Khatauni / Jamabandi Guides
const LAND_GUIDES: Record<SupportedState, DocumentAcquisitionGuide> = {
  up: {
    id: "land-records-up",
    name: { hi: "भूलेख खतौनी नकल (UP Bhulekh Khatauni)", en: "UP Bhulekh Land Record (Khatauni)" },
    category: "land",
    portal_name: { hi: "यूपी भूलेख पोर्टल", en: "UP Bhulekh Portal" },
    portal_url: "https://upbhulekh.gov.in",
    offline_option: { hi: "तहसील भूलेख केंद्र या लेखपाल", en: "Tehsil Bhulekh Kendra or Lekhpal" },
    base_documents: {
      hi: ["गाटा संख्या / खसरा संख्या या खातेदार का नाम", "जनपद, तहसील व ग्राम का नाम"],
      en: ["Khasra / Gata number or landowner name", "District, Tehsil, and Village name"],
    },
    estimated_days: { hi: "तुरंत (Instant PDF डाउनलोड)", en: "Instant (Download PDF)" },
    steps: {
      hi: [
        "upbhulekh.gov.in पर जाएं।",
        "अपना जनपद (District), तहसील और गांव चुनें।",
        "खसरा/गाटा संख्या या नाम दर्ज कर कैप्चा भरें।",
        "डिजिटल खतौनी नकल तुरंत स्क्रीन पर देखें व प्रिंट करें।",
      ],
      en: [
        "Visit upbhulekh.gov.in.",
        "Select your District, Tehsil, and Village.",
        "Enter Gata/Khasra number or landowner name.",
        "Instantly view and download the verified Khatauni copy.",
      ],
    },
  },
  haryana: {
    id: "land-records-haryana",
    name: { hi: "जमाबंदी नकल (Haryana Jamabandi Nakal)", en: "Haryana Jamabandi Land Record" },
    category: "land",
    portal_name: { hi: "जमाबंदी हरियाणा पोर्टल", en: "Jamabandi Haryana Portal" },
    portal_url: "https://jamabandi.nic.in",
    offline_option: { hi: "तहसील कार्यालय / पटवारी", en: "Tehsil Office / Patwari" },
    base_documents: {
      hi: ["खेवट / खतौनी / खसरा संख्या या मालिक का नाम", "जिला, तहसील और गांव"],
      en: ["Khewat / Khatauni / Khasra number or Owner Name", "District, Tehsil and Village"],
    },
    estimated_days: { hi: "तुरंत ऑनलाइन उपलब्ध", en: "Instant online availability" },
    steps: {
      hi: [
        "jamabandi.nic.in पर जाकर 'Jamabandi Nakal' विकल्प चुनें।",
        "मालिक के नाम या खेवट संख्या द्वारा सर्च करें और डिजिटल नकल डाउनलोड करें।",
      ],
      en: [
        "Visit jamabandi.nic.in and select 'Jamabandi Nakal'.",
        "Search by Owner Name or Khewat number and download the copy.",
      ],
    },
  },
  punjab: {
    id: "land-records-punjab",
    name: { hi: "पंजाब जमाबंदी फर्द (Punjab Jamabandi / Fard)", en: "Punjab Land Record (Fard / Jamabandi)" },
    category: "land",
    portal_name: { hi: "पंजाब लैंड रिकॉर्ड्स सोसाइटी (PLRS)", en: "Punjab Land Records Society (PLRS)" },
    portal_url: "https://plrs.org.in",
    offline_option: { hi: "फर्द केंद्र (Fard Kendra) / पटवारखाना", en: "Fard Kendra / Patwarkhana" },
    base_documents: {
      hi: ["खेवट / खतौनी संख्या या काश्तकार का नाम", "जिला, तहसील और गांव"],
      en: ["Khewat/Khatauni number or cultivator name", "District, Tehsil and Village"],
    },
    estimated_days: { hi: "तुरंत ऑनलाइन (या फर्द केंद्र पर 10 मिनट)", en: "Instant online or 10 mins at Fard Kendra" },
    steps: {
      hi: [
        "plrs.org.in पर 'Fard' सेक्शन में जाएं।",
        "जिला, तहसील, गांव और खेवट नंबर चुनकर फर्द नकल डाउनलोड करें।",
      ],
      en: [
        "Visit plrs.org.in under the 'Fard' section.",
        "Select your District, Tehsil, Village and Khewat to download verified Fard.",
      ],
    },
  },
  delhi: {
    id: "land-records-delhi",
    name: { hi: "दिल्ली भूलेख खसरा-खतौनी", en: "Delhi Land Records (Bhulekh)" },
    category: "land",
    portal_name: { hi: "दिल्ली भूलेख पोर्टल", en: "Delhi Bhulekh Portal" },
    portal_url: "https://dlrc.delhigovt.nic.in",
    offline_option: { hi: "एसडीएम / तहसीलदार कार्यालय", en: "SDM / Tehsildar Office" },
    base_documents: { hi: ["खसरा नंबर", "गांव"], en: ["Khasra number", "Village"] },
    estimated_days: { hi: "तुरंत", en: "Instant" },
    steps: {
      hi: ["dlrc.delhigovt.nic.in पर जाकर खसरा नंबर से रिकॉर्ड देखें।"],
      en: ["Search records via Khasra number on dlrc.delhigovt.nic.in."],
    },
  },
  central: {
    id: "land-records-central",
    name: { hi: "भूमि के दस्तावेज़ (खतौनी / जमाबंदी)", en: "Land Records (Khatauni / Jamabandi)" },
    category: "land",
    portal_name: { hi: "राज्य भूलेख पोर्टल", en: "State Bhulekh Portal" },
    portal_url: "https://bhulekh.gov.in",
    offline_option: { hi: "पटवारी या तहसील कार्यालय", en: "Patwari or Tehsil Office" },
    base_documents: { hi: ["खसरा / खतौनी संख्या", "मालिक का नाम"], en: ["Khasra / Khatauni number", "Owner name"] },
    estimated_days: { hi: "1 से 3 कार्य दिवस", en: "1 to 3 working days" },
    steps: {
      hi: ["अपने राज्य के भूलेख पोर्टल से ऑनलाइन नकल डाउनलोड करें या पटवारी से सत्यापित प्रति लें।"],
      en: ["Download land record copy from your state Bhulekh portal or obtain certified copy from Patwari."],
    },
  },
};

// 5. Ration Card / Family ID Guides
const RATION_GUIDES: Record<SupportedState, DocumentAcquisitionGuide> = {
  haryana: {
    id: "ration-ppp-haryana",
    name: { hi: "परिवार पहचान पत्र (PPP Family ID / BPL Ration Card)", en: "PPP Family ID & Haryana Ration Card" },
    category: "ration_ppp",
    portal_name: { hi: "मेरा परिवार हरियाणा पोर्टल", en: "Mera Parivar Haryana Portal" },
    portal_url: "https://meraparivar.haryana.gov.in",
    offline_option: { hi: "निकटतम सीएससी / सरल केंद्र", en: "Nearest CSC / Saral Kendra" },
    base_documents: {
      hi: ["सभी परिवार के सदस्यों का आधार कार्ड", "बैंक खाता विवरण", "बिजली बिल / मकान का विवरण"],
      en: ["Aadhaar cards of all family members", "Bank account details", "Electricity bill"],
    },
    estimated_days: { hi: "7 से 15 दिन", en: "7 to 15 days" },
    steps: {
      hi: [
        "meraparivar.haryana.gov.in पर परिवार के सभी सदस्यों को जोड़कर फैमिली आईडी बनाएं।",
        "यदि वार्षिक आय ₹1.80 लाख से कम सत्यापित होती है, तो ऑटोमैटिक पीला (BPL) राशन कार्ड जारी होता है।",
      ],
      en: [
        "Create Family ID on meraparivar.haryana.gov.in with all member details.",
        "Automatic BPL ration card is generated if family income is verified below ₹1.80 lakh.",
      ],
    },
  },
  punjab: {
    id: "smart-ration-card-punjab",
    name: { hi: "स्मार्ट राशन कार्ड (Punjab Smart Ration Card)", en: "Punjab Smart Ration Card" },
    category: "ration_ppp",
    portal_name: { hi: "खाद्य एवं नागरिक आपूर्ति विभाग पंजाब", en: "Food, Civil Supplies Dept Punjab" },
    portal_url: "https://epos.punjab.gov.in",
    offline_option: { hi: "सेवा केंद्र (Sewa Kendra) या ब्लॉक खाद्य निरीक्षक कार्यालय", en: "Sewa Kendra or Block Food Inspector Office" },
    base_documents: {
      hi: ["परिवार के मुखिया व सदस्यों का आधार", "पंजाब निवास प्रमाण", "आय प्रमाण पत्र (₹60,000/वर्ष से कम)", "बिजली बिल"],
      en: ["Aadhaar of family head & members", "Punjab residence proof", "Income certificate (< ₹60,000/yr)", "Electricity bill"],
    },
    estimated_days: { hi: "15 से 30 कार्य दिवस", en: "15 to 30 working days" },
    steps: {
      hi: [
        "सेवा केंद्र पर जाकर NFSA स्मार्ट राशन कार्ड का फॉर्म जमा करें।",
        "खाद्य निरीक्षक द्वारा भौतिक सत्यापन के बाद नया राशन कार्ड जारी होता है।",
      ],
      en: ["Submit NFSA Smart Ration Card form at Sewa Kendra for Food Inspector verification."],
    },
  },
  delhi: {
    id: "ration-card-delhi",
    name: { hi: "दिल्ली ई-राशन कार्ड (Delhi e-Ration Card)", en: "Delhi e-Ration Card" },
    category: "ration_ppp",
    portal_name: { hi: "दिल्ली खाद्य एवं रसद पोर्टल", en: "Delhi Food & Civil Supplies Portal" },
    portal_url: "https://nfs.delhi.gov.in",
    offline_option: { hi: "सर्किल खाद्य एवं आपूर्ति कार्यालय (FSO Office)", en: "Circle FSO Office" },
    base_documents: {
      hi: ["परिवार के सभी सदस्यों के आधार", "दिल्ली में निवास का साक्ष्य (कम से कम 3 वर्ष)", "परिवार की महिला मुखिया का बैंक खाता"],
      en: ["Aadhaar cards of all members", "3-year residence proof in Delhi", "Bank account of senior female head"],
    },
    estimated_days: { hi: "20 से 45 कार्य दिवस", en: "20 to 45 working days" },
    steps: {
      hi: ["nfs.delhi.gov.in पर परिवार का पंजीकरण करें और महिला मुखिया के नाम से आवेदन करें।"],
      en: ["Register household on nfs.delhi.gov.in under the name of the female head."],
    },
  },
  up: {
    id: "ration-card-up",
    name: { hi: "उत्तर प्रदेश राशन कार्ड (UP FCS Ration Card)", en: "UP FCS Ration Card" },
    category: "ration_ppp",
    portal_name: { hi: "यूपी खाद्य एवं रसद विभाग (FCS UP)", en: "FCS UP Portal" },
    portal_url: "https://fcs.up.gov.in",
    offline_option: { hi: "जन सेवा केंद्र (CSC) या ब्लॉक सप्लाई इंस्पेक्टर कार्यालय", en: "Jan Seva Kendra (CSC) or Supply Inspector" },
    base_documents: {
      hi: ["परिवार के सभी सदस्यों का आधार", "आय प्रमाण पत्र", "निवास प्रमाण", "महिला मुखिया की बैंक पासबुक"],
      en: ["Aadhaar of all members", "Income certificate", "Address proof", "Bank passbook of female head"],
    },
    estimated_days: { hi: "15 से 30 कार्य दिवस", en: "15 to 30 working days" },
    steps: {
      hi: ["सीएससी केंद्र से ऑनलाइन फॉर्म भरवाएं और खंड विकास अधिकारी / सप्लाई इंस्पेक्टर से सत्यापित कराएं।"],
      en: ["Submit through CSC and verify through Block Development Office / Supply Inspector."],
    },
  },
  central: {
    id: "ration-card-central",
    name: { hi: "राष्ट्रीय खाद्य सुरक्षा राशन कार्ड (NFSA Ration Card)", en: "NFSA Ration Card" },
    category: "ration_ppp",
    portal_name: { hi: "राष्ट्रीय खाद्य सुरक्षा पोर्टल (NFSA)", en: "National Food Security Portal" },
    portal_url: "https://nfsa.gov.in",
    offline_option: { hi: "स्थानीय खाद्य एवं आपूर्ति कार्यालय या सीएससी", en: "Local Food & Civil Supplies Office or CSC" },
    base_documents: { hi: ["आधार कार्ड", "आय प्रमाण", "निवास प्रमाण", "फोटो"], en: ["Aadhaar", "Income Proof", "Address Proof", "Photo"] },
    estimated_days: { hi: "15 से 30 कार्य दिवस", en: "15 to 30 working days" },
    steps: {
      hi: ["nfsa.gov.in पर राज्य पोर्टल लिंक से ऑनलाइन आवेदन करें।"],
      en: ["Apply online through state link on nfsa.gov.in."],
    },
  },
};

// 6. Caste & EWS Certificate Guides
const CASTE_EWS_GUIDES: Record<SupportedState, DocumentAcquisitionGuide> = {
  delhi: {
    id: "caste-ews-delhi",
    name: { hi: "जाति / ईडब्ल्यूएस प्रमाण पत्र (SC/ST/OBC/EWS - Delhi)", en: "Caste / EWS Certificate (Delhi)" },
    category: "caste_ews",
    portal_name: { hi: "ई-डिस्ट्रिक्ट दिल्ली", en: "e-District Delhi" },
    portal_url: "https://edistrict.delhigovt.nic.in",
    offline_option: { hi: "एसडीएम कार्यालय", en: "SDM Office" },
    base_documents: {
      hi: ["रक्त संबंधी का पुराना जाति प्रमाण पत्र (पिता/चाचा/भाई)", "दिल्ली निवास प्रमाण", "आधार कार्ड", "फोटो"],
      en: ["Paternal lineage caste certificate (Father/Brother)", "Delhi residence proof", "Aadhaar Card", "Photo"],
    },
    estimated_days: { hi: "14 कार्य दिवस", en: "14 working days" },
    steps: {
      hi: ["edistrict.delhigovt.nic.in पर जाकर संबंधित वर्ग (SC/ST/OBC/EWS) के लिए आवेदन करें।"],
      en: ["Apply on edistrict.delhigovt.nic.in under appropriate category."],
    },
  },
  haryana: {
    id: "caste-ews-haryana",
    name: { hi: "जाति / ईडब्ल्यूएस प्रमाण पत्र (Haryana Caste / EWS)", en: "Caste / EWS Certificate (Haryana)" },
    category: "caste_ews",
    portal_name: { hi: "सरल हरियाणा", en: "Saral Haryana" },
    portal_url: "https://saralharyana.gov.in",
    offline_option: { hi: "सरल केंद्र / तहसील", en: "Saral Kendra / Tehsil" },
    base_documents: { hi: ["परिवार पहचान पत्र (PPP)", "आधार कार्ड", "जाति का स्व-घोषणा पत्र"], en: ["PPP Family ID", "Aadhaar Card", "Self-declaration"] },
    estimated_days: { hi: "3 से 7 कार्य दिवस", en: "3 to 7 working days" },
    steps: {
      hi: ["PPP आईडी के माध्यम से saralharyana.gov.in पर आवेदन करें।"],
      en: ["Apply using Family ID on saralharyana.gov.in."],
    },
  },
  up: {
    id: "caste-ews-up",
    name: { hi: "जाति प्रमाण पत्र (UP Jati Praman Patra)", en: "UP Caste Certificate" },
    category: "caste_ews",
    portal_name: { hi: "ई-साथी यूपी", en: "e-Sathi UP" },
    portal_url: "https://esathi.up.gov.in",
    offline_option: { hi: "जन सेवा केंद्र (CSC) या तहसील", en: "CSC Jan Seva Kendra or Tehsil" },
    base_documents: { hi: ["आधार कार्ड", "स्वप्रमाणित घोषणा पत्र", "परिवार रजिस्टर की नकल / ग्राम प्रधान सत्यापन", "फोटो"], en: ["Aadhaar", "Self-declaration", "Family register copy", "Photo"] },
    estimated_days: { hi: "7 से 15 कार्य दिवस", en: "7 to 15 working days" },
    steps: {
      hi: ["esathi.up.gov.in पर जाति प्रमाण पत्र विकल्प चुनें और लेखपाल जांच हेतु सबमिट करें।"],
      en: ["Select Caste Certificate on esathi.up.gov.in and submit for Lekhpal field report."],
    },
  },
  punjab: {
    id: "caste-ews-punjab",
    name: { hi: "जाति प्रमाण पत्र (Punjab SC/BC Certificate)", en: "Punjab Caste Certificate" },
    category: "caste_ews",
    portal_name: { hi: "ई-सेवा पंजाब", en: "e-Services Punjab" },
    portal_url: "https://eservices.punjab.gov.in",
    offline_option: { hi: "सेवा केंद्र (Sewa Kendra)", en: "Sewa Kendra" },
    base_documents: { hi: ["आधार कार्ड", "पटवारी / सरपंच द्वारा सत्यापन रिपोर्ट", "निवास प्रमाण"], en: ["Aadhaar", "Patwari/Sarpanch report", "Residence proof"] },
    estimated_days: { hi: "7 कार्य दिवस", en: "7 working days" },
    steps: {
      hi: ["सेवा केंद्र में जाकर बायोमेट्रिक देकर आवेदन करें।"],
      en: ["Apply at Sewa Kendra with biometric verification."],
    },
  },
  central: {
    id: "caste-ews-central",
    name: { hi: "जाति / ईडब्ल्यूएस प्रमाण पत्र", en: "Caste / EWS Certificate" },
    category: "caste_ews",
    portal_name: { hi: "राज्य ई-डिस्ट्रिक्ट पोर्टल", en: "State e-District Portal" },
    portal_url: "https://services.india.gov.in",
    offline_option: { hi: "तहसीलदार कार्यालय या सीएससी", en: "Tehsildar Office or CSC" },
    base_documents: { hi: ["आधार कार्ड", "जाति साक्ष्य", "निवास प्रमाण"], en: ["Aadhaar", "Caste proof", "Residence proof"] },
    estimated_days: { hi: "10 से 15 कार्य दिवस", en: "10 to 15 working days" },
    steps: {
      hi: ["तहसीलदार कार्यालय या राज्य पोर्टल से आवेदन करें।"],
      en: ["Apply via Tehsildar office or respective state portal."],
    },
  },
};

// 7. Disability UDID Card Guide
const DISABILITY_UDID_GUIDE: DocumentAcquisitionGuide = {
  id: "udid-disability-card",
  name: { hi: "दिव्यांगता यूडीआईडी कार्ड (Unique Disability ID - UDID)", en: "Unique Disability ID (UDID Card)" },
  category: "disability_vital",
  portal_name: { hi: "स्वावलंबन कार्ड राष्ट्रीय पोर्टल", en: "Swavlamban Card National Portal" },
  portal_url: "https://www.swavlambancard.gov.in",
  offline_option: { hi: "जिला मुख्य चिकित्सा अधिकारी (CMO Office) / जिला अस्पताल मेडिकल बोर्ड", en: "District Civil Hospital / CMO Medical Board" },
  base_documents: {
    hi: ["आधार कार्ड", "निवास प्रमाण पत्र", "जिला अस्पताल द्वारा जारी दिव्यांगता प्रमाण पत्र (यदि पूर्व में बना हो)", "पासपोर्ट रंगीन फोटो"],
    en: ["Aadhaar Card", "Address proof", "Existing disability certificate (if any)", "Passport photograph"],
  },
  estimated_days: { hi: "15 से 30 कार्य दिवस", en: "15 to 30 working days" },
  steps: {
    hi: [
      "swavlambancard.gov.in पर 'Apply for Disability Certificate & UDID Card' चुनें।",
      "व्यक्तिगत जानकारी व दिव्यांगता प्रकार भरें और आवश्यक दस्तावेज अपलोड करें।",
      "निर्धारित तिथि पर जिला सिविल अस्पताल मेडिकल बोर्ड के समक्ष शारीरिक मूल्यांकन कराएं।",
      "स्वीकृति के बाद डिजिटल UDID कार्ड डाउनलोड करें तथा प्लास्टिक कार्ड डाक द्वारा प्राप्त करें।",
    ],
    en: [
      "Visit swavlambancard.gov.in and click 'Apply for Disability Certificate & UDID Card'.",
      "Fill personal and disability details and upload required documents.",
      "Attend the medical board assessment at your District Civil Hospital on the allotted date.",
      "Download digital UDID upon approval; physical plastic card is dispatched via India Post.",
    ],
  },
};

// 8. Aadhaar Update / Mobile Linking Guide
const AADHAAR_UPDATE_GUIDE: DocumentAcquisitionGuide = {
  id: "aadhaar-update",
  name: { hi: "आधार कार्ड अपडेट व मोबाइल लिंकिंग (Aadhaar Update & Mobile Link)", en: "Aadhaar Update & Mobile Linking" },
  category: "identity",
  portal_name: { hi: "माय आधार (UIDAI Portal)", en: "MyAadhaar UIDAI Portal" },
  portal_url: "https://myaadhaar.uidai.gov.in",
  offline_option: { hi: "निकटतम आधार सेवा केंद्र / बैंक शाखा / डाकघर", en: "Nearest Aadhaar Seva Kendra / Bank / Post Office" },
  base_documents: {
    hi: ["वर्तमान आधार कार्ड", "मोबाइल नंबर (ओटीपी हेतु)", "नाम/पते में बदलाव हेतु मान्य प्रमाण (वोटर कार्ड/पासपोर्ट/बिजली बिल)"],
    en: ["Current Aadhaar card", "Mobile number for OTP", "Valid proof of identity/address for demographic changes"],
  },
  estimated_days: { hi: "24 घंटे से 7 दिन", en: "24 hours to 7 days" },
  steps: {
    hi: [
      "पते के ऑनलाइन बदलाव हेतु myaadhaar.uidai.gov.in पर लॉग इन करें।",
      "मोबाइल नंबर या बायोमेट्रिक (फिंगरप्रिंट/आंख) अपडेट कराने हेतु नजदीकी आधार सेवा केंद्र या डाकघर में बायोमेट्रिक कराएं।",
      "महत्वपूर्ण: कभी भी किसी अनधिकृत व्यक्ति या फर्जी वेबसाइट पर अपना आधार नंबर या ओटीपी साझा न करें।",
    ],
    en: [
      "For address update, log in at myaadhaar.uidai.gov.in via mobile OTP.",
      "For mobile number or biometric updates, visit a certified Aadhaar Seva Kendra or Post Office in person.",
      "Safety Alert: Never enter your Aadhaar number or share OTP on unverified portals.",
    ],
  },
};

// Generic Fallback Guide for Unlisted Documents
export const DOCUMENT_TRANSLATIONS_EN: Record<string, string> = {
  "12वीं की मार्कशीट": "12th Class Marksheet",
  "90 दिन के निर्माण कार्य का प्रमाण (ठेकेदार/नियोक्ता द्वारा)": "90 Days Construction Work Proof (from Contractor/Employer)",
  "अनुभव प्रमाण पत्र (यदि हो)": "Work Experience Certificate (if applicable)",
  "आधार कार्ड": "Aadhaar Card",
  "आधार कार्ड या मतदाता पहचान पत्र": "Aadhaar Card or Voter ID Card",
  "आधार से लिंक मोबाइल नंबर": "Aadhaar-linked Mobile Number",
  "आय प्रमाण पत्र": "Income Certificate",
  "आय प्रमाण पत्र (₹1 लाख से कम)": "Income Certificate (Annual Income below ₹1 Lakh)",
  "आय प्रमाण पत्र (अधिकतम ₹3 लाख)": "Income Certificate (Up to ₹3 Lakh Annual)",
  "आय प्रमाण पत्र (ग्रामीण: ₹46,080 / शहरी: ₹56,460)": "Income Certificate (Rural: below ₹46,080 / Urban: below ₹56,460)",
  "आय प्रमाण पत्र / पीपीपी सत्यापित आय": "Income Certificate / PPP Verified Income",
  "आय प्रमाण पत्र / स्व-घोषणा पत्र": "Income Certificate / Self-Declaration",
  "आयु प्रमाण पत्र": "Age Proof Certificate",
  "आयु प्रमाण पत्र / वोटर कार्ड": "Age Proof / Voter ID Card",
  "उत्तर प्रदेश का निवास प्रमाण पत्र": "Uttar Pradesh Residence (Domicile) Certificate",
  "उम्र प्रमाण पत्र (18 वर्ष या अधिक)": "Age Proof (18 years or above)",
  "उम्र प्रमाण पत्र (आयु 58 वर्ष या अधिक)": "Age Proof (58 years or above)",
  "एमसीपी कार्ड (मातृ एवं शिशु सुरक्षा कार्ड)": "MCP Card (Mother & Child Protection Card)",
  "कक्षा 9वीं से 12वीं में प्रवेश का प्रमाण पत्र": "Class 9th to 12th School Enrollment Certificate",
  "कन्या का आयु प्रमाण (विवाह तिथि को न्यूनतम 18 वर्ष)": "Bride's Age Proof (Minimum 18 years on wedding date)",
  "गेट/नेट स्कोरकार्ड": "GATE / NET Scorecard",
  "छात्रा का आधार कार्ड": "Girl Student's Aadhaar Card",
  "जमीन का मालिकाना प्रमाण": "Land Ownership Proof",
  "जाति प्रमाण पत्र (SC/BC) या BPL प्रमाण पत्र": "Caste Certificate (SC/BC) or BPL Certificate",
  "जाति प्रमाण पत्र (यदि लागू हो)": "Caste Certificate (if applicable)",
  "जॉब कार्ड (मनरेगा)": "MGNREGA Job Card",
  "टीकाकरण कार्ड (MCH Card)": "Immunization / MCH Card",
  "तहसीलदार द्वारा जारी आय प्रमाण पत्र (ग्रामीण: ₹46,080 / शहरी: ₹56,460 से कम)": "Tehsildar-Issued Income Certificate (Rural < ₹46,080 / Urban < ₹56,460)",
  "दिल्ली का बैंक खाता पासबुक": "Delhi Bank Account Passbook",
  "दिल्ली का वोटर आईडी कार्ड / आधार कार्ड": "Delhi Voter ID Card / Aadhaar Card",
  "दुल्हन का आधार कार्ड": "Bride's Aadhaar Card",
  "दोनों पुत्रियों के जन्म प्रमाण पत्र": "Birth Certificates of Both Daughters",
  "निवास प्रमाण पत्र": "Residence / Domicile Certificate",
  "पंजाब निवास प्रमाण पत्र": "Punjab Residence Certificate",
  "पंजाब निवास प्रमाण पत्र (Domicile)": "Punjab Domicile Certificate",
  "पंजाब में न्यूनतम 5 वर्ष का निवास प्रमाण": "Proof of Minimum 5 Years Residence in Punjab",
  "पंजाब स्थायी निवास प्रमाण": "Punjab Permanent Residence Proof",
  "पंजाब स्थायी निवास प्रमाण पत्र": "Punjab Permanent Residence Certificate",
  "परियोजना रिपोर्ट (Project Report)": "Project Report",
  "परिवार के सभी सदस्यों के आधार कार्ड": "Aadhaar Cards of All Family Members",
  "परिवार पहचान दस्तावेज": "Family Identity Document",
  "परिवार पहचान पत्र (PPP - Parivar Pehchan Patra)": "Parivar Pehchan Patra (PPP - Family ID)",
  "परिवार पहचान पत्र (PPP)": "Parivar Pehchan Patra (PPP Family ID)",
  "पारिवारिक आय प्रमाण पत्र": "Family Income Certificate",
  "पारिवारिक आय प्रमाण पत्र (वार्षिक ₹60,000 से कम)": "Family Income Certificate (Annual < ₹60,000)",
  "पासपोर्ट साइज फोटो": "Passport-Size Photograph",
  "पिछली कक्षा की अंकतालिका (मार्कशीट)": "Previous Class Marksheet",
  "पिछले 6 महीने का बैंक स्टेटमेंट": "Last 6 Months Bank Statement",
  "पुत्री और पिता/अभिभावक का आधार कार्ड": "Aadhaar Cards of Daughter & Father/Guardian",
  "पैन कार्ड": "PAN Card",
  "फसल बुवाई का प्रमाण पत्र (पटवारी/पंचायत द्वारा)": "Crop Sowing Certificate (from Patwari / Panchayat)",
  "बचत बैंक खाता पासबुक / जन धन खाता": "Savings Bank Passbook / Jan Dhan Account",
  "बचत बैंक खाता विवरण": "Savings Bank Account Details",
  "बच्ची और माता-पिता का आधार कार्ड": "Aadhaar Cards of Girl Child & Parents",
  "बच्ची का जन्म प्रमाण पत्र": "Girl Child Birth Certificate",
  "बच्ची का जन्म प्रमाण पत्र (जन्म के 1 वर्ष के भीतर आवेदन)": "Girl Child Birth Certificate (apply within 1 year of birth)",
  "बच्चे का जन्म प्रमाण पत्र या माता-पिता का आधार कार्ड": "Child's Birth Certificate or Parents' Aadhaar Card",
  "बिजली बिल / मकान का पता प्रमाण": "Electricity Bill / Home Address Proof",
  "बीपीएल राशन कार्ड": "BPL Ration Card",
  "बैंक खाता पासबुक": "Bank Account Passbook",
  "बैंक पासबुक (आधार एनपीसीआई लिंक)": "Bank Passbook (Aadhaar NPCI Seeded)",
  "भूमि के कागजात": "Land Ownership Records",
  "भूमि के दस्तावेज (खतौनी/जमाबंदी)": "Land Records (Khatauni / Jamabandi)",
  "भूमि के दस्तावेज (खसरा/खतौनी)": "Land Records (Khasra / Khatauni)",
  "महिला का आधार कार्ड": "Applicant Woman's Aadhaar Card",
  "महिला का व्यक्तिगत बैंक खाता पासबुक": "Applicant Woman's Personal Bank Passbook",
  "माता और पति का आधार कार्ड": "Aadhaar Cards of Mother & Husband",
  "माता/पिता का सेवा प्रमाण पत्र (WARB/Discharge Certificate)": "Parent's Service / WARB / Discharge Certificate",
  "माता-पिता / अभिभावक का आधार कार्ड": "Parents' / Guardian's Aadhaar Card",
  "माता-पिता का आधार कार्ड": "Parents' Aadhaar Card",
  "माता-पिता का दिल्ली में 3 वर्ष का निवास प्रमाण पत्र": "Parents' 3-Year Delhi Residence Certificate",
  "मान्यता प्राप्त संस्थान में शोध प्रवेश पत्र": "PhD Admission Letter from Recognized Institution",
  "मास्टर डिग्री मार्कशीट": "Master's Degree Marksheet",
  "मूल निवास प्रमाण पत्र (उत्तर प्रदेश)": "Domicile Certificate (Uttar Pradesh)",
  "मोबाइल नंबर": "Active Mobile Number",
  "राशन कार्ड (बीपीएल/अंत्योदय)": "Ration Card (BPL / Antyodaya)",
  "राशन कार्ड या किसान J-फॉर्म": "Ration Card or Farmer J-Form",
  "राशन कार्ड या परिवार पहचान पत्र": "Ration Card or Family ID (PPP)",
  "वर का आयु प्रमाण (न्यूनतम 21 वर्ष)": "Groom's Age Proof (Minimum 21 years)",
  "विद्यार्थी का आधार कार्ड": "Student's Aadhaar Card",
  "विधायक या राजपत्रित अधिकारी द्वारा सत्यापन": "Verification by MLA or Gazetted Officer",
  "वेंडिंग प्रमाण पत्र / पहचान पत्र (नगर पालिका द्वारा) या सिफारिश पत्र (LoR)": "Certificate of Vending / Municipality ID or Letter of Recommendation (LoR)",
  "व्यवसाय का प्रमाण / कोटेशन": "Business Proof / Equipment Quotation",
  "शादी का कार्ड / विवाह प्रमाण पत्र": "Wedding Invitation Card / Marriage Certificate",
  "शैक्षणिक एवं कौशल योग्यता प्रमाण पत्र": "Educational & Skill Qualification Certificate",
  "शैक्षणिक योग्यता प्रमाण पत्र (8वीं पास यदि परियोजना 10 लाख से अधिक हो)": "Educational Qualification Certificate (8th Pass if project > ₹10 Lakh)",
  "संस्थान का बोनाफाइड प्रमाण पत्र": "Bonafide Student Certificate from Institution",
  "सरकारी या सहायता प्राप्त स्कूल में छात्र प्रवेश नामांकन": "Enrollment Proof in Govt / Govt-Aided School",
  "सरकारी स्कूल पहचान पत्र (Student ID)": "Government School Student ID Card",
  "सीएमओ (मुख्य चिकित्सा अधिकारी) द्वारा जारी दिव्यांगता प्रमाण पत्र (न्यूनतम 40%)": "CMO-Issued Disability Certificate (Minimum 40%)",
  "स्कूल प्रवेश प्रमाण पत्र": "School Admission Certificate",
  "स्कूल/कॉलेज प्रवेश रसीद": "School / College Admission Fee Receipt",
  "स्व-प्रमाणित स्वास्थ्य प्रमाण पत्र (Medical Fitness)": "Self-Attested Medical Fitness Certificate",
  "डीबीओसीडब्ल्यूडब्ल्यूबी कार्ड (DBOCWWB Worker ID)": "DBOCWWB Registration Card",
  "दिल्ली पीडब्ल्यूडी यूडीआईडी कार्ड / दिव्यांगता प्रमाण पत्र": "UDID Card / Disability Certificate",
  "दिल्ली मतदाता पहचान पत्र / 10 वर्ष निवास प्रमाण": "Delhi Voter ID / 10-Year Delhi Residence Proof",
  "अधिवक्ता बार काउंसिल पंजीकरण प्रमाण पत्र": "Bar Council of Delhi Enrolment Certificate",
  "बिजली बिल / सीए नंबर (CA Number)": "Electricity Bill / CA Number",
  "दिल्ली जल बोर्ड बिल / केएनओ (KNO Number)": "Delhi Jal Board Water Bill / KNO",
  "शहीद सैनिक / कर्मी लाइन-ऑफ-ड्यूटी प्रमाण पत्र": "Official Line-of-Duty Casualty Certificate",
  "अस्पताल डिस्चार्ज समरी एवं मेडिकल बिल": "Hospital Discharge Summary & Medical Bills",
  "एफआईआर (FIR) / पुलिस या आपदा रिपोर्ट": "FIR / Police / Revenue Incident Report",
  "खेल उपलब्धि / पदक प्रमाण पत्र": "Sports Merit / Medal Certificate",
  "ड्राइविंग लाइसेंस (कमर्शियल/ऑटो)": "Valid Commercial / Auto Driving Licence",
  "वित्तीय / आयकर व 4-पहिया न होने की घोषणा": "Non-IT/GST & No 4-Wheeler Self-Declaration",
  "अल्पसंख्यक समुदाय प्रमाण पत्र": "Minority Community Certificate",
  "यूपी फैमिली आईडी (एक परिवार एक पहचान)": "UP Family ID (Ek Parivar Ek Pahchan)",
  "मेरी फसल मेरा ब्यौरा (MFMB) पंजीकरण": "Meri Fasal Mera Byora (MFMB) Registration",
  "ई-श्रम यूएएन (e-Shram UAN Card)": "e-Shram UAN Card",
  "अस्पताल/चिकित्सा पर्ची": "Hospital OPD Slip / Medical Prescription",
  "ई-श्रम यूएएन / श्रमिक बोर्ड पंजीकरण कार्ड": "e-Shram UAN / BOCW Labour Registration Card",
  "राशन कार्ड या परिवार पहचान दस्तावेज": "Ration Card or Family Identity Document",
  "संबंधित श्रेणी / उपलब्धि प्रमाण पत्र": "Relevant Category / Achievement Certificate",
};

const DOCUMENT_TRANSLATIONS_HI: Record<string, string> = Object.fromEntries(
  Object.entries(DOCUMENT_TRANSLATIONS_EN).map(([hi, en]) => [en.toLowerCase(), hi])
);

const ENGLISH_TO_HINDI_EXTRA: Record<string, string> = {
  aadhaar: "आधार कार्ड",
  "aadhaar card": "आधार कार्ड",
  "aadhaar-seeded bank passbook": "आधार से लिंक बैंक खाता पासबुक",
  "bank passbook": "बैंक खाता पासबुक",
  "bank account": "बैंक खाता पासबुक",
  "bank details": "बैंक खाता विवरण",
  "delhi domicile": "दिल्ली मूल निवास प्रमाण पत्र",
  "delhi residence proof": "दिल्ली निवास प्रमाण पत्र",
  "delhi income certificate": "दिल्ली आय प्रमाण पत्र",
  "income certificate": "आय प्रमाण पत्र",
  "caste certificate": "जाति प्रमाण पत्र",
  "birth certificate": "जन्म प्रमाण पत्र",
  "death certificate": "मृत्यु प्रमाण पत्र",
  "marriage certificate": "विवाह प्रमाण पत्र",
  "ration card": "राशन कार्ड",
  "udid card": "यूडीआईडी (दिव्यांगता) कार्ड",
  "disability certificate": "दिव्यांगता प्रमाण पत्र",
  "mobile number": "मोबाइल नंबर",
  "photo": "पासपोर्ट साइज फोटो",
  "passport photograph": "पासपोर्ट साइज फोटो",
  "passport photo": "पासपोर्ट साइज फोटो",
  "1984 riot victim relief id / sanction order": "1984 दंगा पीड़ित राहत आईडी / स्वीकृति आदेश",
  "3-year delhi residency proof": "3 वर्ष का दिल्ली निवास प्रमाण पत्र",
  "5-year delhi residence proof": "5 वर्ष का दिल्ली निवास प्रमाण पत्र",
  "60+ age proof & aadhaar": "60+ आयु प्रमाण पत्र एवं आधार कार्ड",
  "abha id / aadhaar (helpful)": "आभा (ABHA) आईडी / आधार कार्ड (वैकल्पिक)",
  "aadhaar & age proof (60+)": "आधार कार्ड एवं आयु प्रमाण (60+)",
  "aadhaar & delhi address proof": "आधार कार्ड एवं दिल्ली पता प्रमाण",
  "aadhaar & delhi domicile": "आधार कार्ड एवं दिल्ली मूल निवास प्रमाण पत्र",
  "aadhaar & delhi income certificate": "आधार कार्ड एवं दिल्ली आय प्रमाण पत्र",
  "aadhaar & delhi residence proof": "आधार कार्ड एवं दिल्ली निवास प्रमाण पत्र",
  "aadhaar & delhi residence/income proof": "आधार कार्ड एवं दिल्ली निवास / आय प्रमाण पत्र",
  "aadhaar & photo": "आधार कार्ड एवं फोटो",
  "aadhaar & voter id": "आधार कार्ड एवं मतदाता पहचान पत्र",
  "aadhaar (60+)": "आधार कार्ड (60+ वर्ष)",
  "aadhaar / id": "आधार कार्ड / पहचान पत्र",
  "aadhaar card (age 70+)": "आधार कार्ड (आयु 70+)",
  "aadhaar card / valid id": "आधार कार्ड / वैध पहचान पत्र",
  "aadhaar, pan & delhi domicile": "आधार कार्ड, पैन कार्ड एवं दिल्ली मूल निवास प्रमाण",
  "aadhaar, voter id & delhi residence proof": "आधार, मतदाता पहचान पत्र एवं दिल्ली निवास प्रमाण",
  "aadhaar-seeded bank account": "आधार से जुड़ा (NPCI लिंक) बैंक खाता",
  "active dbocwwb card": "सक्रिय दिल्ली निर्माण श्रमिक बोर्ड (DBOCWWB) कार्ड",
  "admission letter & fee structure": "प्रवेश पत्र एवं शुल्क विवरण",
  "age & income declaration": "आयु एवं आय स्व-घोषणा पत्र",
  "agricultural land khatauni": "कृषि भूमि खतौनी दस्तावेज",
  "all family members' aadhaar": "परिवार के सभी सदस्यों के आधार कार्ड",
  "animal health card (if issued)": "पशु स्वास्थ्य कार्ड (यदि जारी हुआ हो)",
  "any id/aadhaar if available (not required for emergency entry)": "कोई पहचान पत्र / आधार (यदि उपलब्ध हो; आपातकालीन प्रवेश हेतु अनिवार्य नहीं)",
  "applicant aadhaar & relationship proof": "आवेदक का आधार कार्ड एवं संबंध प्रमाण",
  "bpl/sc/st proof (for jsy)": "BPL / SC / ST प्रमाण पत्र (JSY हेतु)",
  "bank passbook & noc": "बैंक पासबुक एवं अनापत्ति प्रमाण पत्र (NOC)",
  "bank passbook & vendor technical docs": "बैंक पासबुक एवं सोलर वेंडर तकनीकी दस्तावेज",
  "bank passbook (where dbt used)": "बैंक खाता पासबुक (जहाँ DBT लागू हो)",
  "bank statements & project quotation": "बैंक स्टेटमेंट एवं परियोजना कोटेशन",
  "bar council of delhi enrolment cert/id": "बार काउंसिल ऑफ दिल्ली पंजीकरण प्रमाण पत्र / आईडी",
  "beneficiary aadhaar & delhi residence proof": "लाभार्थी का आधार कार्ड एवं दिल्ली निवास प्रमाण",
  "birth certificate & aadhaar": "जन्म प्रमाण पत्र एवं आधार कार्ड",
  "both spouses' aadhaar & delhi domicile": "पति-पत्नी दोनों का आधार कार्ड एवं दिल्ली निवास प्रमाण",
  "breadwinner's death certificate": "परिवार के मुखिया का मृत्यु प्रमाण पत्र",
  "bride's birth/age proof & aadhaar": "वधू का जन्म / आयु प्रमाण एवं आधार कार्ड",
  "cbdc-enabled bank passbook": "CBDC-सक्षम सक्रिय बैंक पासबुक",
  "case papers": "न्यायालय / मामले से जुड़े कागजात",
  "cash/upi ₹5 token (no complex paperwork)": "₹5 नकद / UPI टोकन (किसी जटिल कागज की आवश्यकता नहीं)",
  "caste/minority certificate": "जाति / अल्पसंख्यक प्रमाण पत्र",
  "caste/minority certificate & income certificate": "जाति / अल्पसंख्यक प्रमाण पत्र एवं आय प्रमाण पत्र",
  "category/eligibility proof (woman/child/sc-st/pwd/income)": "श्रेणी / पात्रता प्रमाण (महिला / बच्चा / SC-ST / दिव्यांग / आय)",
  "category/income certificate (if applicable)": "जाति / आय प्रमाण पत्र (यदि लागू हो)",
  "child admission/bonafide & prev marksheet": "बच्चे का प्रवेश / बोनाफाइड प्रमाण एवं पिछली मार्कशीट",
  "child birth certificate & hospital discharge": "बच्चे का जन्म प्रमाण पत्र एवं अस्पताल डिस्चार्ज पर्ची",
  "child's birth certificate & photo": "बच्चे का जन्म प्रमाण पत्र एवं फोटो",
  "class 10 & 12 marksheets from delhi": "दिल्ली से कक्षा 10 व 12 की अंकतालिकाएं",
  "class 10/12 marksheets": "कक्षा 10 व 12 की अंकतालिकाएं",
  "class 12 / prev semester marksheet & fee receipt": "कक्षा 12 / पिछले सेमेस्टर की मार्कशीट व फीस रसीद",
  "class viii marksheet & school bonafide": "कक्षा 8 की अंकतालिका एवं स्कूल बोनाफाइड प्रमाण",
  "consumer aadhaar & delhi address": "उपभोक्ता आधार कार्ड एवं दिल्ली पता प्रमाण",
  "consumer aadhaar & delhi address proof": "उपभोक्ता आधार कार्ड एवं दिल्ली पता प्रमाण",
  "court/inquiry record": "न्यायालय / जांच अभिलेख",
  "crop loss survey record": "फसल नुकसान सर्वे / गिरदावरी अभिलेख",
  "dbocwwb card": "दिल्ली निर्माण श्रमिक बोर्ड (DBOCWWB) पंजीकरण कार्ड",
  "dbocwwb card & contribution record": "DBOCWWB कार्ड एवं अंशदान रिकॉर्ड",
  "djb kno / water bill": "दिल्ली जल बोर्ड (DJB) KNO नंबर / पानी का बिल",
  "death certificate & delhi domicile/service proof": "मृत्यु प्रमाण पत्र एवं दिल्ली निवास / सेवा प्रमाण",
  "deceased dbocwwb card & death certificate": "मृत श्रमिक का DBOCWWB कार्ड एवं मृत्यु प्रमाण पत्र",
  "deceased worker's dbocwwb card": "मृत निर्माण श्रमिक का DBOCWWB कार्ड",
  "deceased worker/pensioner dbocwwb card & death certificate": "मृत श्रमिक / पेंशनर का DBOCWWB कार्ड एवं मृत्यु प्रमाण पत्र",
  "deceased's death certificate & covid-19 record": "मृतक का मृत्यु प्रमाण पत्र एवं कोविड-19 अभिलेख",
  "degree marksheet & topper certificate": "डिग्री अंकतालिका एवं विश्वविद्यालय टॉपर प्रमाण पत्र",
  "delhi address proof": "दिल्ली का पता प्रमाण पत्र",
  "delhi domicile/class 10 & 12 marksheets": "दिल्ली मूल निवास प्रमाण व कक्षा 10 व 12 की अंकतालिकाएं",
  "delhi domicile/school proof": "दिल्ली मूल निवास / दिल्ली स्कूल अध्ययन प्रमाण",
  "delhi domicile/schooling/income proof (for quota/waiver)": "दिल्ली निवास / स्कूली शिक्षा / आय प्रमाण (शुल्क छूट हेतु)",
  "delhi electricity bill / ca no.": "दिल्ली बिजली बिल / सीए नंबर (CA Number)",
  "delhi family income certificate": "दिल्ली पारिवारिक आय प्रमाण पत्र",
  "delhi income certificate (if applicable)": "दिल्ली आय प्रमाण पत्र (यदि लागू हो)",
  "delhi office proof & pitch deck": "दिल्ली कार्यालय पता प्रमाण एवं स्टार्टअप पिच डेक",
  "delhi rto registration & bank passbook": "दिल्ली RTO पंजीकरण एवं बैंक पासबुक",
  "delhi residence/domicile proof": "दिल्ली निवास / मूल निवास प्रमाण पत्र",
  "delhi residence/income proof (where linked)": "दिल्ली निवास / आय प्रमाण (जहाँ आवश्यक हो)",
  "delhi residence/land proof": "दिल्ली निवास / भूमि प्रमाण पत्र",
  "delhi sc certificate": "दिल्ली अनुसूचित जाति (SC) प्रमाण पत्र",
  "delhi sc/st/obc certificate": "दिल्ली SC / ST / OBC जाति प्रमाण पत्र",
  "delhi school id & prev marksheet": "दिल्ली स्कूल आईडी कार्ड एवं पिछली अंकतालिका",
  "delhi school/domicile & category certificate": "दिल्ली स्कूल / मूल निवास एवं श्रेणी प्रमाण पत्र",
  "delhi school/residence proof": "दिल्ली स्कूल / निवास प्रमाण पत्र",
  "delhi vending/residence proof": "दिल्ली रेहड़ी-पटरी / निवास प्रमाण पत्र",
  "delhi voter id / 10-yr delhi residency proof": "दिल्ली मतदाता आईडी / 10 वर्ष का दिल्ली निवास प्रमाण",
  "dependency proof": "आश्रित होने का प्रमाण पत्र",
  "details of children/relatives & property papers": "संतान/परिजन विवरण एवं संपत्ति के कागजात",
  "discharge book / esm id / ppo": "डिस्चार्ज बुक / भूतपूर्व सैनिक आईडी / PPO",
  "ews income certificate / caste certificate / cwsn disability certificate": "EWS आय प्रमाण / जाति प्रमाण / CWSN दिव्यांगता प्रमाण पत्र",
  "educational marksheets": "शैक्षणिक अंकतालिकाएं",
  "electricity ca number / latest bill": "बिजली सीए नंबर (CA Number) / नवीनतम बिल",
  "electricity/property tax bill": "बिजली या संपत्ति कर (हाउस टैक्स) बिल",
  "employer employment & dlwb contribution proof": "नियोक्ता रोजगार व DLWB कल्याण निधि अंशदान प्रमाण",
  "employment & income proof (for working hostel)": "रोजगार एवं आय प्रमाण पत्र (कामकाजी महिला छात्रावास हेतु)",
  "expense plan & bank account": "खर्च योजना एवं बैंक खाता विवरण",
  "eye screening / opd slip": "नेत्र जांच / OPD पर्ची",
  "fir / charge sheet / medical or post-mortem record": "FIR / आरोप पत्र / मेडिकल या पोस्ट-मॉर्टम रिपोर्ट",
  "fir / mlc / medical report": "FIR / MLC / मेडिकल रिपोर्ट",
  "fir/post-mortem report (if accidental)": "FIR / पोस्ट-मॉर्टम रिपोर्ट (दुर्घटना की स्थिति में)",
  "family & children declaration": "परिवार एवं संतान संख्या घोषणा पत्र",
  "family aadhaar cards": "परिवार के सदस्यों के आधार कार्ड",
  "family income proof": "पारिवारिक आय प्रमाण पत्र",
  "farmer / land cultivation proof": "किसान / खेती-भूमि प्रमाण पत्र",
  "federation endorsement": "खेल महासंघ (Federation) अनुमोदन पत्र",
  "foreign university unconditional offer letter": "विदेशी विश्वविद्यालय का बिना शर्त प्रवेश प्रस्ताव पत्र",
  "founders' aadhaar & pan": "संस्थापकों का आधार एवं पैन कार्ड",
  "freedom fighter recognition / ppo order": "स्वतंत्रता सेनानी मान्यता / PPO आदेश",
  "girl child birth certificate & aadhaar": "कन्या शिशु का जन्म प्रमाण पत्र एवं आधार कार्ड",
  "govt hospital estimate & prescription": "सरकारी अस्पताल का खर्च आकलन (Estimate) व पर्ची",
  "govt hospital treatment estimate": "सरकारी अस्पताल का उपचार खर्च आकलन",
  "hospital medical certificate of miscarriage": "गर्भपात का सरकारी / पंजीकृत अस्पताल चिकित्सा प्रमाण पत्र",
  "hospital/marriage/marksheet proof": "अस्पताल / विवाह / अंकतालिका प्रमाण",
  "husband's death certificate / divorce or separation proof": "पति का मृत्यु प्रमाण पत्र / तलाक या अलगाव प्रमाण",
  "husband's death certificate / income proof": "पति का मृत्यु प्रमाण पत्र / आय प्रमाण",
  "id proof (relaxed in sakhi emergency)": "पहचान पत्र (सखी आपात स्थिति में शिथिल)",
  "id/address proof": "पहचान एवं पता प्रमाण पत्र",
  "incident / police / fire / revenue report or death cert": "घटना / पुलिस / अग्निशमन / राजस्व रिपोर्ट या मृत्यु प्रमाण पत्र",
  "income certificate <=₹2.5l": "आय प्रमाण पत्र (₹2.5 लाख या कम)",
  "income declaration": "वार्षिक आय स्व-घोषणा पत्र",
  "income/ews proof": "आय / ईडब्ल्यूएस (EWS) प्रमाण पत्र",
  "income/ews proof & delhi residence proof": "आय / EWS प्रमाण पत्र एवं दिल्ली निवास प्रमाण",
  "incorporation / partnership deed & dpiit certificate": "कंपनी/फर्म पंजीकरण एवं DPIIT मान्यता प्रमाण पत्र",
  "joint bank account": "पति-पत्नी का संयुक्त बैंक खाता",
  "khasra-khatauni / cultivation proof": "खसरा-खतौनी / खेती का प्रमाण",
  "life/dependency certificate": "जीवित / आश्रित होने का प्रमाण पत्र",
  "livestock/dairy unit details": "पशुधन / डेयरी इकाई विवरण",
  "mcp / antenatal card": "मातृ-शिशु सुरक्षा (MCP / प्रसव-पूर्व) कार्ड",
  "mp/mla endorsement": "सांसद (MP) / विधायक (MLA) सत्यापन अनुमोदन",
  "marriage certificate/invitation & age proof": "विवाह प्रमाण पत्र / कार्ड एवं आयु प्रमाण",
  "marriage invitation/certificate": "विवाह निमंत्रण पत्र / विवाह प्रमाण पत्र",
  "marriage registration certificate": "विवाह पंजीकरण प्रमाण पत्र",
  "marriage/medical/death grant proof": "विवाह / चिकित्सा / मृत्यु अनुदान प्रमाण",
  "medal certificate & federation verification": "पदक प्रमाण पत्र एवं खेल महासंघ सत्यापन",
  "medical assessment": "चिकित्सा मूल्यांकन रिपोर्ट",
  "medical board disability certificate": "मेडिकल बोर्ड द्वारा जारी दिव्यांगता प्रमाण पत्र",
  "medical fitness certificate": "चिकित्सा स्वस्थता (Medical Fitness) प्रमाण पत्र",
  "medical fitness note": "चिकित्सक का स्वास्थ्य प्रमाण नोट",
  "mother's widow certificate / husband death certificate or orphan proof": "माता का विधवा / पिता मृत्यु प्रमाण पत्र या अनाथ प्रमाण",
  "nfsa/bpl ration card or income certificate": "NFSA / BPL राशन कार्ड या आय प्रमाण पत्र",
  "national/international medal certificates": "राष्ट्रीय / अंतरराष्ट्रीय पदक प्रमाण पत्र",
  "next-of-kin aadhaar, heir proof & bank details": "निकटतम परिजन का आधार, वारिस प्रमाण एवं बैंक विवरण",
  "nominee & bank details": "नॉमिनी एवं बैंक खाता विवरण",
  "nominee aadhaar & relationship proof": "नॉमिनी का आधार कार्ड एवं संबंध प्रमाण",
  "non-ownership affidavit": "स्वयं का पक्का घर न होने का शपथ पत्र",
  "original current session fee receipts": "वर्तमान सत्र की मूल शुल्क रसीदें",
  "owner aadhaar/id & address": "पशुपालक का आधार / पहचान पत्र व पता",
  "parent/guardian details": "माता-पिता / अभिभावक विवरण",
  "parents' aadhaar & delhi residence/domicile": "माता-पिता का आधार एवं दिल्ली निवास / मूल निवास प्रमाण",
  "passport / visa / bank details": "पासपोर्ट / वीजा / बैंक खाता विवरण",
  "photo & survey details": "फोटो एवं सर्वेक्षण विवरण",
  "possession/title chain (gpa, sale agreement, will, payment receipt)": "कब्जा / स्वामित्व श्रृंखला दस्तावेज (GPA, एग्रीमेंट, वसीयत, रसीद)",
  "prev marksheet & attendance certificate": "पिछली अंकतालिका एवं स्कूल उपस्थिति प्रमाण पत्र",
  "prior medical reports (if any)": "पूर्व चिकित्सा रिपोर्ट (यदि उपलब्ध हो)",
  "project report (dpr)": "परियोजना रिपोर्ट (DPR)",
  "project report/quotation": "परियोजना रिपोर्ट / मशीनरी कोटेशन",
  "project/quotation & bank account": "परियोजना / कोटेशन एवं बैंक खाता",
  "promoters' aadhaar, pan & delhi residence": "प्रमोटरों का आधार, पैन व दिल्ली निवास प्रमाण",
  "proof of artistic/literary contribution": "कला / साहित्यिक योगदान का प्रमाण",
  "property ownership/noc & aadhaar": "संपत्ति स्वामित्व / NOC एवं आधार कार्ड",
  "property/plot documents & cost estimate": "संपत्ति / प्लॉट के कागजात व निर्माण लागत अनुमान",
  "qualification & category cert": "योग्यता एवं जाति/श्रेणी प्रमाण पत्र",
  "qualifying degree marksheets": "योग्यता डिग्री अंकतालिकाएं",
  "qualifying marksheet & admission/fee proof": "योग्यता अंकतालिका एवं प्रवेश / शुल्क प्रमाण",
  "qualifying marksheets (8/10/12/iti)": "योग्यता अंकतालिकाएं (8वीं / 10वीं / 12वीं / ITI)",
  "rwa / locality proposal": "RWA / स्थानीय क्षेत्र विकास प्रस्ताव",
  "ration card / nfsa proof": "राशन कार्ड / NFSA पात्रता प्रमाण",
  "registered mobile": "पंजीकृत मोबाइल नंबर",
  "residence proof in notified colony": "अधिसूचित कॉलोनी में निवास का प्रमाण",
  "sc basti site verification": "अनुसूचित जाति बस्ती स्थल सत्यापन रिपोर्ट",
  "sc caste certificate of sc spouse": "अनुसूचित जाति (SC) जीवनसाथी का जाति प्रमाण पत्र",
  "sc/st/obc certificate & family income certificate": "SC / ST / OBC प्रमाण पत्र एवं पारिवारिक आय प्रमाण पत्र",
  "sdm income certificate (<=₹3l) or nfsa card": "SDM आय प्रमाण पत्र (₹3 लाख तक) या NFSA राशन कार्ड",
  "school admission/roll proof": "स्कूल प्रवेश / नामांकन प्रमाण",
  "school enrolment proof": "स्कूल नामांकन प्रमाण पत्र",
  "school id/enrolment proof": "स्कूल आईडी कार्ड / नामांकन प्रमाण",
  "school/college bonafide & photo": "स्कूल / कॉलेज बोनाफाइड प्रमाण एवं फोटो",
  "site proof & bank passbook": "कार्यस्थल प्रमाण एवं बैंक पासबुक",
  "slum survey / household proof & delhi residence proof": "झुग्गी सर्वे / परिवार प्रमाण एवं दिल्ली निवास प्रमाण",
  "specialist prescription / referral": "विशेषज्ञ डॉक्टर की पर्ची / रेफरल",
  "sports merit certificates": "खेल योग्यता / उपलब्धि प्रमाण पत्र",
  "spouse aadhaar & relationship proof": "जीवनसाथी का आधार कार्ड एवं संबंध प्रमाण",
  "student id / senior age proof / freedom fighter cert": "छात्र आईडी / वरिष्ठ नागरिक आयु प्रमाण / स्वतंत्रता सेनानी प्रमाण",
  "tool quotation / purchase bill": "औजार कोटेशन / खरीद बिल",
  "udid / disability certificate": "UDID कार्ड / दिव्यांगता प्रमाण पत्र",
  "udid card / disability certificate (>=40%)": "UDID कार्ड / न्यूनतम 40% दिव्यांगता प्रमाण पत्र",
  "udyam / firm registration": "उद्यम (Udyam) / फर्म पंजीकरण प्रमाण",
  "valid commercial/auto driving licence & badge": "वैध वाणिज्यिक / ऑटो ड्राइविंग लाइसेंस एवं बैज",
  "vehicle invoice & insurance": "वाहन इनवॉइस (बिल) एवं बीमा",
  "vendor aadhaar": "रेहड़ी-पटरी विक्रेता का आधार कार्ड",
  "victim aadhaar/id": "पीड़ित का आधार कार्ड / पहचान पत्र",
  "victim sc/st caste certificate & aadhaar": "पीड़ित का SC / ST जाति प्रमाण पत्र एवं आधार कार्ड",
  "victim/heir aadhaar & delhi address proof": "पीड़ित / वारिस का आधार एवं दिल्ली पता प्रमाण",
  "worker & child aadhaar": "श्रमिक एवं बच्चे का आधार कार्ड",
  "worker aadhaar & delhi work/residence proof": "श्रमिक का आधार एवं दिल्ली कार्य / निवास प्रमाण",
};

/**
 * Translates any document string from scheme data into Hindi or clean English.
 */
export function translateDocumentName(docString: string, language: "hi" | "en" = "hi"): string {
  const clean = (docString || "").trim();
  if (!clean) return "";

  if (language === "hi") {
    const lower = clean.toLowerCase();
    if (DOCUMENT_TRANSLATIONS_HI[lower]) return DOCUMENT_TRANSLATIONS_HI[lower];
    if (ENGLISH_TO_HINDI_EXTRA[lower]) return ENGLISH_TO_HINDI_EXTRA[lower];
    // If string contains ASCII only (English stored), apply smart keyword Hindi hints while preserving clarity
    if (/^[\x00-\x7F\u20B9]+$/.test(clean)) {
      if (lower.includes("aadhaar")) return `आधार कार्ड (${clean})`;
      if (lower.includes("domicile") || lower.includes("residence")) return `निवास प्रमाण पत्र (${clean})`;
      if (lower.includes("income")) return `आय प्रमाण पत्र (${clean})`;
      if (lower.includes("caste") || /\bsc\b|\bst\b|\bobc\b/.test(lower)) return `जाति प्रमाण पत्र (${clean})`;
      if (lower.includes("bank") || lower.includes("passbook")) return `बैंक खाता पासबुक (${clean})`;
      if (lower.includes("udid") || lower.includes("disability")) return `यूडीआईडी / दिव्यांगता प्रमाण (${clean})`;
      if (lower.includes("dbocwwb")) return `निर्माण श्रमिक बोर्ड कार्ड (${clean})`;
    }
    return clean;
  }

  if (DOCUMENT_TRANSLATIONS_EN[clean]) {
    return DOCUMENT_TRANSLATIONS_EN[clean];
  }

  // Fallback keyword mapping for custom or uncatalogued Hindi document strings
  const norm = clean.toLowerCase();
  if (/^[\x00-\x7F\u20B9]+$/.test(clean)) return clean;
  if (norm.includes("आधार")) return "Aadhaar Card";
  if (norm.includes("आय प्रमाण")) return "Income Certificate";
  if (norm.includes("निवास") || norm.includes("अधिवास")) return "Residence / Domicile Certificate";
  if (norm.includes("जाति")) return "Caste Certificate";
  if (norm.includes("बैंक") || norm.includes("पासबुक")) return "Bank Account Passbook";
  if (norm.includes("राशन")) return "Ration Card";
  if (norm.includes("खतौनी") || norm.includes("जमाबंदी") || norm.includes("भूमि")) return "Land Ownership Record";
  if (norm.includes("दिव्यांग") || norm.includes("विकलांग")) return "Disability Certificate (UDID)";
  if (norm.includes("फोटो")) return "Passport-Size Photograph";
  if (norm.includes("मार्कशीट") || norm.includes("अंकतालिका")) return "Educational Marksheet";
  if (norm.includes("जन्म प्रमाण")) return "Birth Certificate";
  if (norm.includes("मृत्यु प्रमाण")) return "Death Certificate";
  if (norm.includes("विवाह") || norm.includes("शादी")) return "Marriage Proof / Certificate";
  if (norm.includes("पैन")) return "PAN Card";
  if (norm.includes("मोबाइल")) return "Mobile Number";
  return clean;
}

export function getGenericDocumentGuide(docName: string): DocumentAcquisitionGuide {
  const cleanEn = translateDocumentName(docName, "en");
  const cleanHi = translateDocumentName(docName, "hi");
  return {
    id: `generic-${docName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    name: { hi: `${cleanHi} कैसे बनवाएं?`, en: cleanEn },
    category: "identity",
    portal_name: { hi: "राष्ट्रीय सरकारी सेवा पोर्टल (India Services)", en: "National Government Services Portal" },
    portal_url: "https://services.india.gov.in",
    offline_option: { hi: "निकटतम सीएससी जन सेवा केंद्र या संबंधित ब्लॉक/तहसील कार्यालय", en: "Nearest CSC Center or Block/Tehsil Office" },
    base_documents: {
      hi: ["आधार कार्ड", "निवास प्रमाण पत्र", "पासपोर्ट साइज फोटो"],
      en: ["Aadhaar Card", "Residence Proof", "Passport Photographs"],
    },
    estimated_days: { hi: "7 से 15 कार्य दिवस", en: "7 to 15 working days" },
    steps: {
      hi: [
        "services.india.gov.in पर जाकर अपने राज्य व संबंधित दस्तावेज का नाम खोजें।",
        "या अपने नजदीकी सीएससी जन सेवा केंद्र (CSC Kendra) पर मूल आधार कार्ड लेकर जाएं।",
        "अधिकारी द्वारा आवेदन फॉर्म भरकर सत्यापन शुल्क रसीद प्राप्त करें।",
      ],
      en: [
        "Search your document on services.india.gov.in by selecting your state.",
        "Alternatively, visit your nearest Common Service Center (CSC) with your Aadhaar.",
        "Submit the prescribed form and collect the acknowledgement receipt.",
      ],
    },
  };
}

/**
 * Resolves state-specific acquisition guide for any given document string.
 */
export function getDocumentGuide(docString: string, state?: string): DocumentAcquisitionGuide {
  const norm = docString.toLowerCase();
  const cleanState: SupportedState =
    state === "delhi" || state === "haryana" || state === "up" || state === "punjab"
      ? state
      : "central";

  let guide: DocumentAcquisitionGuide;

  // 1. Income Certificate matches
  if (norm.includes("आय") || norm.includes("income")) {
    guide = INCOME_GUIDES[cleanState] || INCOME_GUIDES.central;
  }
  // 2. Residence / Domicile matches
  else if (
    norm.includes("निवास") ||
    norm.includes("अधिवास") ||
    norm.includes("domicile") ||
    norm.includes("residence")
  ) {
    guide = RESIDENCE_GUIDES[cleanState] || RESIDENCE_GUIDES.central;
  }
  // 3. Caste / EWS matches
  else if (
    norm.includes("जाति") ||
    norm.includes("caste") ||
    norm.includes("ews") ||
    norm.includes("ईडब्ल्यूएस") ||
    /\b(sc|st|obc)\b/i.test(norm)
  ) {
    guide = CASTE_EWS_GUIDES[cleanState] || CASTE_EWS_GUIDES.central;
  }
  // 4. Ration Card / Family ID / PPP matches
  else if (
    norm.includes("राशन") ||
    norm.includes("ration") ||
    norm.includes("ppp") ||
    norm.includes("परिवार पहचान") ||
    norm.includes("family id")
  ) {
    guide = RATION_GUIDES[cleanState] || RATION_GUIDES.central;
  }
  // 5. Land Records / Khatauni / Jamabandi matches
  else if (
    norm.includes("खतौनी") ||
    norm.includes("जमाबंदी") ||
    norm.includes("भूमि") ||
    norm.includes("फर्द") ||
    norm.includes("khatauni") ||
    norm.includes("jamabandi") ||
    norm.includes("land")
  ) {
    guide = LAND_GUIDES[cleanState] || LAND_GUIDES.central;
  }
  // 6. Bank Account & DBT Seeding matches
  else if (
    norm.includes("बैंक") ||
    norm.includes("bank") ||
    norm.includes("dbt") ||
    norm.includes("पासबुक") ||
    norm.includes("passbook") ||
    norm.includes("सीडिंग")
  ) {
    guide = DBT_BANKING_GUIDE;
  }
  // 7. Disability / UDID matches
  else if (
    norm.includes("दिव्यांग") ||
    norm.includes("विकलांग") ||
    norm.includes("disability") ||
    norm.includes("udid")
  ) {
    guide = DISABILITY_UDID_GUIDE;
  }
  // 8. Aadhaar Card / Identity matches
  else if (norm.includes("आधार") || norm.includes("aadhaar")) {
    guide = AADHAAR_UPDATE_GUIDE;
  }
  // Default fallback for any other document
  else {
    guide = getGenericDocumentGuide(docString);
  }

  return {
    ...guide,
    official_fee: guide.official_fee || {
      hi: "सरकारी पोर्टल फीस: ₹0 से ₹30 (पोर्टल पर निःशुल्क या न्यूनतम सरकारी शुल्क)",
      en: "Official Statutory Fee: ₹0 to ₹30 max (Free on portal or nominal fee)",
    },
    anti_dalal_tip: guide.anti_dalal_tip || {
      hi: "दलालों से सावधान: तहसील या केंद्र के बाहर किसी बिचौलिए को ₹300-₹500 न दें। ऑनलाइन आवेदन खुद करें या आधिकारिक रसीद लेकर ही ₹30 दें।",
      en: "Anti-Middleman Alert: Do not pay extra cash to middlemen outside offices. Apply directly or pay only the statutory fee with a valid receipt.",
    },
  };
}
