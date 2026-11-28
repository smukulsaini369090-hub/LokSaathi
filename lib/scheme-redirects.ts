/**
 * Discontinued, Merged, Superseded & Viral/Fake Scheme Redirect Registry.
 * Protects Indian citizens from viral rumours, outdated portals, and middleman scams
 * across Delhi, Haryana, Uttar Pradesh, Punjab, and Central Government schemes.
 */

export type RedirectCategory =
  | "discontinued"
  | "merged"
  | "fake_or_confused"
  | "verify_latest_notification"
  | "legacy_alias";

export interface SchemeRedirectEntry {
  id: string;
  legacy_slugs: string[];
  keywords: string[];
  jurisdiction: "delhi" | "haryana" | "up" | "punjab" | "central";
  status: RedirectCategory;
  old_name_en: string;
  old_name_hi: string;
  replacement_codes: string[]; // Canonical scheme_codes e.g. ["DL-022"]
  replacement_ids?: string[]; // Legacy/friendly slugs if needed
  alert_title_hi: string;
  alert_title_en: string;
  alert_message_hi: string;
  alert_message_en: string;
  official_note?: string;
}

export const SCHEME_REDIRECTS: SchemeRedirectEntry[] = [
  // ---------------- DELHI ----------------
  {
    id: "delhi-ladli-2008-discontinued",
    legacy_slugs: ["delhi-ladli-scheme", "ladli-scheme-delhi"],
    keywords: [
      "delhi ladli",
      "दिल्ली लाड़ली",
      "दिल्ली लाडली",
      "ladli 2008",
      "delhi ladli 2008",
      "ladli scheme",
    ],
    jurisdiction: "delhi",
    status: "discontinued",
    old_name_en: "Delhi Ladli Scheme (2008)",
    old_name_hi: "दिल्ली लाड़ली योजना (2008)",
    replacement_codes: ["DL-022"],
    alert_title_hi: "⚠️ योजना बंद (Discontinued 31 Mar 2026) → नई योजना देखें",
    alert_title_en: "⚠️ Discontinued (31 Mar 2026) → Replaced by Active Scheme",
    alert_message_hi:
      "दिल्ली लाड़ली योजना (2008) में नए आवेदन 31 मार्च 2026 से बंद हो चुके हैं। इसकी जगह 1 अप्रैल 2026 से 'दिल्ली लखपति बिटिया योजना (DL-022)' लागू है।",
    alert_message_en:
      "Delhi Ladli Scheme (2008) closed for new enrolments on 31 Mar 2026. It is replaced by Delhi Lakhpati Bitiya Scheme (DL-022) w.e.f. 1 Apr 2026.",
  },
  {
    id: "delhi-aam-aadmi-mohalla-clinics-merged",
    legacy_slugs: ["aam-aadmi-mohalla-clinic", "mohalla-clinics-delhi"],
    keywords: ["mohalla clinic", "aam aadmi mohalla clinic", "मोहल्ला क्लीनिक"],
    jurisdiction: "delhi",
    status: "merged",
    old_name_en: "Aam Aadmi Mohalla Clinics",
    old_name_hi: "आम आदमी मोहल्ला क्लीनिक",
    replacement_codes: ["DL-015"],
    alert_title_hi: "🔄 एकीकृत सेवा → आयुष्मान आरोग्य मंदिर दिल्ली (DL-015)",
    alert_title_en: "🔄 Integrated → Ayushman Arogya Mandir Delhi (DL-015)",
    alert_message_hi:
      "मोहल्ला क्लीनिक सेवाएं अब 'आयुष्मान आरोग्य मंदिर दिल्ली (DL-015)' में एकीकृत की गई हैं। निःशुल्क OPD, दवाएं व जांच जारी हैं।",
    alert_message_en:
      "Aam Aadmi Mohalla Clinics have been integrated into Ayushman Arogya Mandir Delhi (DL-015) for free primary OPD care and diagnostics.",
  },
  {
    id: "delhi-ladli-behna-fake-viral",
    legacy_slugs: ["delhi-ladli-behna", "ladli-behna-delhi"],
    keywords: [
      "delhi ladli behna",
      "ladli behna delhi",
      "दिल्ली लाडली बहना",
      "दिल्ली लाड़ली बहना",
      "ladli behna",
    ],
    jurisdiction: "delhi",
    status: "fake_or_confused",
    old_name_en: "Delhi Ladli Behna Yojana (Viral/Fake Confusion)",
    old_name_hi: "दिल्ली लाडली बहना योजना (भ्रामक/फर्जी नाम)",
    replacement_codes: ["DL-021"],
    alert_title_hi: "🚨 भ्रामक नाम से सावधान → दिल्ली लक्ष्मी योजना (DL-021) देखें",
    alert_title_en: "🚨 Viral Name Alert → Active Delhi Scheme is DL-021",
    alert_message_hi:
      "'लाडली बहना योजना' मध्य प्रदेश की है, दिल्ली की नहीं। दिल्ली में ₹2,500/माह वाली असली महिला योजना का नाम 'दिल्ली लक्ष्मी योजना (DL-021)' है। किसी फर्जी लिंक को पैसे न दें।",
    alert_message_en:
      "There is NO 'Delhi Ladli Behna Yojana' (Ladli Behna belongs to MP). Delhi's official ₹2,500/month women's scheme is Delhi Lakshmi Yojana (DL-021).",
  },
  {
    id: "delhi-ghar-ghar-ration-discontinued",
    legacy_slugs: ["mukhyamantri-ghar-ghar-ration", "ghar-ghar-ration-delhi"],
    keywords: ["ghar ghar ration", "ghar-ghar ration", "घर-घर राशन", "घर घर राशन"],
    jurisdiction: "delhi",
    status: "discontinued",
    old_name_en: "Mukhyamantri Ghar-Ghar Ration Yojana (Delhi)",
    old_name_hi: "मुख्यमंत्री घर-घर राशन योजना (दिल्ली)",
    replacement_codes: ["DL-079"],
    alert_title_hi: "⚠️ योजना बंद / लागू नहीं → दिल्ली राशन कार्ड (DL-079) उपयोग करें",
    alert_title_en: "⚠️ Not Operational → Use Delhi PDS Ration (DL-079)",
    alert_message_hi:
      "मुख्यमंत्री घर-घर राशन योजना वर्तमान में बंद/लागू नहीं है। निःशुल्क राशन के लिए 'दिल्ली NFSA राशन कार्ड (DL-079)' के अंतर्गत उचित मूल्य की दुकान से राशन लें।",
    alert_message_en:
      "Mukhyamantri Ghar-Ghar Ration Yojana is discontinued/not operational. Use official Delhi PDS Ration Card (DL-079) via Fair Price Shops.",
  },
  {
    id: "delhi-jai-bhim-verify-latest",
    legacy_slugs: ["jai-bhim-pratibha-vikas"],
    keywords: ["jai bhim mukhyamantri", "jai bhim pratibha", "जय भीम मुख्यमंत्री प्रतिभा"],
    jurisdiction: "delhi",
    status: "verify_latest_notification",
    old_name_en: "Jai Bhim Mukhyamantri Pratibha Vikas Yojana",
    old_name_hi: "जय भीम मुख्यमंत्री प्रतिभा विकास योजना",
    replacement_codes: ["DL-011", "DL-003"],
    alert_title_hi: "🔔 नवीनतम सरकारी सूचना सत्यापित करें ([VERIFY LATEST NOTIFICATION])",
    alert_title_en: "🔔 Verify Latest 2026–27 Notification Status",
    alert_message_hi:
      "2026–27 में सक्रिय कोचिंग सूची की पुष्टि के लिए कृपया scstwelfare.delhi.gov.in व edudel.nic.in (DL-011 / DL-003) की नवीनतम अधिसूचना देखें।",
    alert_message_en:
      "Check latest 2026–27 operational circulars on scstwelfare.delhi.gov.in and edudel.nic.in before applying; see DL-011 / DL-003.",
  },
  {
    id: "delhi-farishtey-verify-latest",
    legacy_slugs: ["farishtey-dilli-ke"],
    keywords: ["farishtey dilli", "farishtey scheme delhi", "फरिश्ते दिल्ली"],
    jurisdiction: "delhi",
    status: "verify_latest_notification",
    old_name_en: "Farishtey Dilli Ke",
    old_name_hi: "फरिश्ते दिल्ली के",
    replacement_codes: ["DL-013", "IN-100"],
    alert_title_hi: "🔔 नवीनतम अधिसूचना देखें (Farishtey Dilli Ke)",
    alert_title_en: "🔔 Verify Latest 2026–27 Notification (Farishtey Dilli Ke)",
    alert_message_hi:
      "वर्तमान लागू स्थिति के लिए health.delhi.gov.in पर नवीनतम परिपत्र देखें। सड़क दुर्घटना गुड समैरिटन राहत IN-100 व अस्पताल कवर DL-013 में भी उपलब्ध है।",
    alert_message_en:
      "Verify latest 2026–27 GNCTD Health notification on health.delhi.gov.in. National Good Samaritan relief (IN-100) and cashless hospital care (DL-013) are active.",
  },
  {
    id: "delhi-1076-doorstep-verify-latest",
    legacy_slugs: ["delhi-doorstep-1076"],
    keywords: ["1076 doorstep", "doorstep delivery delhi", "1076 डोरस्टेप"],
    jurisdiction: "delhi",
    status: "verify_latest_notification",
    old_name_en: "1076 Doorstep Delivery of Services (Delhi)",
    old_name_hi: "1076 डोरस्टेप डिलीवरी सेवा (दिल्ली)",
    replacement_codes: ["DL-001"],
    alert_title_hi: "🔔 नवीनतम परिपत्र देखें → e-District Delhi / CFC सेवा",
    alert_title_en: "🔔 Verify Latest Circular → Use e-District Delhi / CFC",
    alert_message_hi:
      "दिल्ली में सभी प्रमाण-पत्र ऑनलाइन edistrict.delhigovt.nic.in या नजदीकी नागरिक सुविधा केंद्र (CFC) से बनते हैं; 1076 होम विजिट की वर्तमान स्थिति पोर्टल पर सत्यापित करें।",
    alert_message_en:
      "Verify latest 1076 doorstep operational notice on edistrict.delhigovt.nic.in; citizens can apply anytime online or at Citizen Facilitation Centres (CFCs).",
  },
  {
    id: "delhi-labour-welfare-expanded",
    legacy_slugs: ["delhi-labour-welfare"],
    keywords: [],
    jurisdiction: "delhi",
    status: "legacy_alias",
    old_name_en: "Delhi Building & Construction Workers Scheme (Combined Legacy View)",
    old_name_hi: "दिल्ली निर्माण श्रमिक कल्याण योजना (संयुक्त)",
    replacement_codes: ["DL-050", "DL-059", "DL-060", "DL-052"],
    alert_title_hi: "📋 सभी 15 दिल्ली श्रमिक लाभ अब अलग-अलग कोड (DL-050..DL-064) में उपलब्ध",
    alert_title_en: "📋 Expanded into Individual DBOCWWB & DLWB Schemes (DL-050..DL-064)",
    alert_message_hi:
      "निर्माण श्रमिक लाभ अब मातृत्व (DL-050), वृद्धावस्था पेंशन (DL-052), मृत्यु सहायता (DL-057), शिक्षा (DL-059) व विवाह (DL-060) के रूप में अलग-अलग उपलब्ध हैं।",
    alert_message_en:
      "Worker welfare benefits are now categorized into individual entitlements: Maternity (DL-050), Pension (DL-052), Education (DL-059), Marriage (DL-060), and DLWB (DL-064).",
  },

  // ---------------- HARYANA ----------------
  {
    id: "haryana-manual-ppp-merge",
    legacy_slugs: ["haryana-manual-bpl-oldage"],
    keywords: [
      "manual bpl haryana",
      "manual old age haryana",
      "paper ration card haryana",
      "हरियाणा ऑफलाइन राशन",
    ],
    jurisdiction: "haryana",
    status: "merged",
    old_name_en: "Manual Haryana BPL/AAY Ration & Old-Age Paper Applications",
    old_name_hi: "हरियाणा मैनुअल BPL राशन एवं ऑफलाइन वृद्धावस्था पेंशन आवेदन",
    replacement_codes: ["HR-032", "HR-104"],
    alert_title_hi: "🔄 परिवार पहचान पत्र (PPP) में स्वचालित रूप से एकीकृत",
    alert_title_en: "🔄 Merged into Parivar Pehchan Patra (PPP) Auto-Verification",
    alert_message_hi:
      "हरियाणा में BPL राशन कार्ड (HR-104) और वृद्धावस्था सम्मान भत्ता (HR-032) अब मैनुअल पेपर की जगह परिवार पहचान पत्र (PPP / Family ID) से स्वचालित (proactive) रूप से बनते हैं।",
    alert_message_en:
      "Manual paper applications in Haryana were merged into Parivar Pehchan Patra (PPP) auto-verification under HR-032 and HR-104.",
  },
  {
    id: "haryana-pre2021-scholarship-merged",
    legacy_slugs: ["haryana-pre2021-scholarship"],
    keywords: ["pre-2021 haryana scholarship", "old haryana college scholarship portal"],
    jurisdiction: "haryana",
    status: "merged",
    old_name_en: "Pre-2021 Haryana Higher Education Scholarship Portals",
    old_name_hi: "हरियाणा 2021-पूर्व उच्च शिक्षा छात्रवृत्ति पोर्टल",
    replacement_codes: ["HR-012", "HR-006", "HR-007"],
    alert_title_hi: "🔄 एकीकृत पोर्टल: हर-छात्रवृत्ति (Har-Chhatravratti)",
    alert_title_en: "🔄 Merged into Har-Chhatravratti Unified Portal",
    alert_message_hi:
      "सभी हरियाणा कॉलेज छात्रवृत्तियाँ अब एक ही आधिकारिक पोर्टल harchhatravratti.highereduhry.ac.in (HR-006, HR-007, HR-012) में एकीकृत हैं।",
    alert_message_en:
      "Separate pre-2021 Haryana higher-ed scholarship portals have merged into Har-Chhatravratti (HR-006, HR-007, HR-012).",
  },
  {
    id: "haryana-old-ladli-2005-discontinued",
    legacy_slugs: ["haryana-ladli-2005"],
    keywords: ["haryana ladli 2005", "old haryana ladli", "हरियाणा लाड़ली 2005"],
    jurisdiction: "haryana",
    status: "discontinued",
    old_name_en: "Old Haryana Ladli Scheme (2005)",
    old_name_hi: "पुरानी हरियाणा लाड़ली योजना (2005)",
    replacement_codes: ["HR-025", "HR-034", "HR-023"],
    alert_title_hi: "🔄 नए जन्म हेतु 'आपकी बेटी हमारी बेटी (HR-025)' से प्रतिस्थापित",
    alert_title_en: "🔄 Replaced for New Births by Aapki Beti Hamari Beti (HR-025)",
    alert_message_hi:
      "नए बालिका जन्म लाभों के लिए अब 'आपकी बेटी हमारी बेटी (HR-025)' लागू है (यह सक्रिय HR-034 लाड़ली सामाजिक सुरक्षा भत्ता व HR-023 दीन दयाल लाड़ो लक्ष्मी योजना से भिन्न है)।",
    alert_message_en:
      "Old Haryana Ladli (2005) was replaced for new births by Aapki Beti Hamari Beti (HR-025). Do not confuse with active HR-034 (2-daughter allowance) or HR-023 (₹2,100/mo women).",
  },
  {
    id: "haryana-lado-lakshmi-split-superseded",
    legacy_slugs: ["haryana-lado-lakshmi-split"],
    keywords: ["lado lakshmi split", "split payout lado lakshmi", "लाड़ो लक्ष्मी विभाजित"],
    jurisdiction: "haryana",
    status: "merged",
    old_name_en: "Former Split-Payout Option under Deen Dayal Lado Lakshmi",
    old_name_hi: "दीन दयाल लाड़ो लक्ष्मी योजना — पूर्व विभाजित भुगतान विकल्प",
    replacement_codes: ["HR-023"],
    alert_title_hi: "🔄 1 नवम्बर 2026 से निश्चित ₹2,100/माह भुगतान लागू (HR-023)",
    alert_title_en: "🔄 Superseded w.e.f. 1 Nov 2026 by Fixed ₹2,100/month (HR-023)",
    alert_message_hi:
      "पूर्व विभाजित भुगतान विकल्प को समाप्त कर 1 नवम्बर 2026 से दीन दयाल लाड़ो लक्ष्मी योजना (HR-023) में ₹2,100/माह निश्चित DBT लागू किया गया है।",
    alert_message_en:
      "The former split-payout option was superseded effective 1 Nov 2026 by a fixed ₹2,100/month payout under HR-023.",
  },

  // ---------------- UTTAR PRADESH ----------------
  {
    id: "up-samajwadi-pension-discontinued",
    legacy_slugs: ["samajwadi-pension-yojana", "up-samajwadi-pension"],
    keywords: ["samajwadi pension", "समाजवादी पेंशन"],
    jurisdiction: "up",
    status: "discontinued",
    old_name_en: "Samajwadi Pension Yojana (UP, 2014)",
    old_name_hi: "समाजवादी पेंशन योजना (उत्तर प्रदेश)",
    replacement_codes: ["UP-031", "UP-032", "UP-088"],
    alert_title_hi: "⚠️ योजना बंद → सक्रिय SSPY पेंशन योजनाएं (UP-031/032/088) देखें",
    alert_title_en: "⚠️ Discontinued → Use Active UP SSPY Pensions",
    alert_message_hi:
      "समाजवादी पेंशन योजना बंद हो चुकी है। उत्तर प्रदेश में पात्र नागरिक वृद्धावस्था (UP-031), विधवा/निराश्रित महिला (UP-032) व दिव्यांगजन (UP-088) पेंशन में आवेदन करें।",
    alert_message_en:
      "Samajwadi Pension Yojana is discontinued. Eligible UP citizens apply on sspy-up.gov.in under UP-031 (Old Age), UP-032 (Widow), or UP-088 (Divyangjan).",
  },
  {
    id: "up-kanya-vidya-dhan-discontinued",
    legacy_slugs: ["kanya-vidya-dhan", "up-kanya-vidya-dhan"],
    keywords: ["kanya vidya dhan", "कन्या विद्या धन"],
    jurisdiction: "up",
    status: "discontinued",
    old_name_en: "UP Kanya Vidya Dhan Yojana",
    old_name_hi: "यूपी कन्या विद्या धन योजना",
    replacement_codes: ["UP-022"],
    alert_title_hi: "⚠️ प्रतिस्थापित → मुख्यमंत्री कन्या सुमंगला योजना (UP-022)",
    alert_title_en: "⚠️ Replaced by Mukhyamantri Kanya Sumangala Yojana (UP-022)",
    alert_message_hi:
      "कन्या विद्या धन की जगह उत्तर प्रदेश सरकार अब 6 चरणों में ₹25,000 देने वाली 'मुख्यमंत्री कन्या सुमंगला योजना (UP-022)' चला रही है।",
    alert_message_en:
      "Kanya Vidya Dhan has been replaced by Mukhyamantri Kanya Sumangala Yojana (UP-022) offering ₹25,000 across 6 stages.",
  },
  {
    id: "up-free-laptop-2012-discontinued",
    legacy_slugs: ["up-free-laptop", "up-laptop-yojana-2012"],
    keywords: [
      "up free laptop",
      "free laptop up",
      "free laptop 2012",
      "यूपी मुफ्त लैपटॉप",
      "यूपी फ्री लैपटॉप",
    ],
    jurisdiction: "up",
    status: "discontinued",
    old_name_en: "UP Free Laptop Yojana (2012)",
    old_name_hi: "यूपी निःशुल्क लैपटॉप योजना (2012)",
    replacement_codes: ["UP-003"],
    alert_title_hi: "🔄 प्रतिस्थापित → स्वामी विवेकानंद युवा सशक्तिकरण योजना (UP-003)",
    alert_title_en: "🔄 Replaced by Swami Vivekananda Yuva Sashaktikaran (UP-003)",
    alert_message_hi:
      "पुरानी 2012 लैपटॉप योजना बंद हो चुकी है। वर्तमान में यूपी के कॉलेज छात्रों को 'स्वामी विवेकानंद युवा सशक्तिकरण योजना (UP-003)' के तहत स्मार्टफोन/टैबलेट मिलते हैं।",
    alert_message_en:
      "The 2012 UP Free Laptop scheme was replaced by Swami Vivekananda Yuva Sashaktikaran Yojana (UP-003) distributing smartphones/tablets.",
  },
  {
    id: "up-berozgari-bhatta-2012-discontinued",
    legacy_slugs: ["up-berozgari-bhatta"],
    keywords: ["berozgari bhatta up", "up berozgari bhatta", "यूपी बेरोजगारी भत्ता", "बेरोजगारी भत्ता 2012"],
    jurisdiction: "up",
    status: "discontinued",
    old_name_en: "UP Berozgari Bhatta (2012)",
    old_name_hi: "यूपी बेरोजगारी भत्ता (2012)",
    replacement_codes: ["UP-056", "UP-004", "UP-060"],
    alert_title_hi: "⚠️ भत्ता योजना बंद → CM-YUVA (UP-056), CMAPS (UP-004) व UPSDM (UP-060)",
    alert_title_en: "⚠️ Allowance Discontinued → Replaced by UP Skill & Youth Loan Schemes",
    alert_message_hi:
      "यूपी में 2012 का बेरोजगारी भत्ता बंद हो चुका है। युवाओं के लिए CM-YUVA ब्याज-मुक्त ₹5 लाख ऋण (UP-056), अप्रेंटिसशिप वजीफा CMAPS (UP-004) व कौशल प्रशिक्षण UPSDM (UP-060) सक्रिय हैं।",
    alert_message_en:
      "UP Berozgari Bhatta (2012) is discontinued. Active replacements are CM-YUVA interest-free enterprise loan (UP-056), CMAPS apprenticeship stipend (UP-004), and UPSDM skilling (UP-060).",
  },
  {
    id: "up-bhagya-lakshmi-merged",
    legacy_slugs: ["up-bhagya-lakshmi"],
    keywords: ["up bhagya lakshmi", "भाग्य लक्ष्मी उत्तर प्रदेश"],
    jurisdiction: "up",
    status: "merged",
    old_name_en: "UP Bhagya Lakshmi Yojana",
    old_name_hi: "उत्तर प्रदेश भाग्य लक्ष्मी योजना",
    replacement_codes: ["UP-022"],
    alert_title_hi: "🔄 कन्या सुमंगला योजना (UP-022) में एकीकृत/प्रतिस्थापित",
    alert_title_en: "🔄 Consolidated into CM Kanya Sumangala Yojana (UP-022)",
    alert_message_hi:
      "बालिका जन्म व शिक्षा वित्तीय सहायता अब उत्तर प्रदेश में 'मुख्यमंत्री कन्या सुमंगला योजना (UP-022)' (₹25,000 DBT) के रूप में संचालित है।",
    alert_message_en:
      "Girl child financial grants in UP are consolidated under Mukhyamantri Kanya Sumangala Yojana (UP-022).",
  },

  // ---------------- PUNJAB ----------------
  {
    id: "punjab-bpssby-merged",
    legacy_slugs: ["bpssby", "bhagat-puran-singh-sehat-bima"],
    keywords: ["bpssby", "bhagat puran singh", "भगत पूरन सिंह"],
    jurisdiction: "punjab",
    status: "merged",
    old_name_en: "Bhagat Puran Singh Sehat Bima Yojana (BPSSBY)",
    old_name_hi: "भगत पूरन सिंह सेहत बीमा योजना (BPSSBY)",
    replacement_codes: ["PB-011"],
    alert_title_hi: "🔄 सरबत सेहत बीमा / मुख्यमंत्री सेहत बीमा (PB-011) में विलय",
    alert_title_en: "🔄 Merged into Mukh Mantri Sehat Bima / Sarbat Sehat Bima (PB-011)",
    alert_message_hi:
      "BPSSBY को पंजाब की व्यापक 'मुख्यमंत्री सेहत बीमा / सरबत सेहत बीमा योजना (PB-011)' में विलय कर दिया गया है।",
    alert_message_en:
      "BPSSBY has been merged into Mukh Mantri Sehat Bima / Sarbat Sehat Bima (PB-011).",
  },
  {
    id: "punjab-shagun-renamed",
    legacy_slugs: ["punjab-shagun-scheme"],
    keywords: ["punjab shagun", "shagun scheme punjab", "शगुन स्कीम पंजाब", "पंजाब शगुन"],
    jurisdiction: "punjab",
    status: "merged",
    old_name_en: "Punjab Shagun Scheme",
    old_name_hi: "पंजाब शगुन योजना",
    replacement_codes: ["PB-020"],
    alert_title_hi: "🔄 नया नाम: पंजाब आशीर्वाद योजना (PB-020)",
    alert_title_en: "🔄 Renamed as Punjab Ashirwad Scheme (PB-020)",
    alert_message_hi:
      "पंजाब शगुन योजना का आधिकारिक नाम अब 'आशीर्वाद योजना (PB-020)' है (योग्य परिवारों की बेटी के विवाह पर ₹51,000 सहायता)।",
    alert_message_en:
      "Punjab Shagun Scheme was renamed to Punjab Ashirwad Scheme (PB-020) providing ₹51,000 marriage assistance.",
  },
  {
    id: "punjab-captain-smart-connect-discontinued",
    legacy_slugs: ["captain-smart-connect"],
    keywords: ["captain smart connect", "कैप्टन स्मार्ट कनेक्ट", "punjab free smartphone"],
    jurisdiction: "punjab",
    status: "discontinued",
    old_name_en: "Captain Smart Connect Scheme (Punjab)",
    old_name_hi: "कैप्टन स्मार्ट कनेक्ट योजना (पंजाब)",
    replacement_codes: ["PB-007"],
    alert_title_hi: "⚠️ योजना समाप्त/बंद → पंजाब शिक्षा योजनाएं (PB-001..PB-007) देखें",
    alert_title_en: "⚠️ Discontinued → View Active Punjab School Support (PB-007)",
    alert_message_hi:
      "कैप्टन स्मार्ट कनेक्ट स्मार्टफोन वितरण योजना बंद हो चुकी है। सरकारी स्कूल सहायता के लिए PB-004 व PB-007 देखें।",
    alert_message_en:
      "Captain Smart Connect has been discontinued. Refer to active school scholarships & support schemes PB-004 and PB-007.",
  },
  {
    id: "punjab-old-200-units-superseded",
    legacy_slugs: ["punjab-200-unit-power"],
    keywords: [
      "200 unit punjab",
      "200 units punjab",
      "punjab 200 unit",
      "punjab 200 units",
      "200 unit free power punjab",
      "200 unit free power",
      "old 200-unit free power punjab",
      "200 यूनिट पंजाब बिजली",
    ],
    jurisdiction: "punjab",
    status: "merged",
    old_name_en: "Old 200-Unit Free Power Slab (Punjab)",
    old_name_hi: "पंजाब पुरानी 200-यूनिट मुफ्त बिजली योजना",
    replacement_codes: ["PB-073"],
    alert_title_hi: "🔄 उन्नत योजना: 300 यूनिट/माह मुफ्त घरेलू बिजली (PB-073)",
    alert_title_en: "🔄 Upgraded to 300 Units/Month Free Domestic Power (PB-073)",
    alert_message_hi:
      "पुरानी 200-यूनिट सीमा को बढ़ाकर सभी घरेलू उपभोक्ताओं के लिए '300 यूनिट प्रति माह (600 प्रति द्वि-माह) मुफ्त घरेलू बिजली (PB-073)' लागू किया गया है।",
    alert_message_en:
      "Superseded by universal 300 Units/Month (600 units bi-monthly) Free Domestic Electricity (PB-073).",
  },
  {
    id: "punjab-proposed-1000-women-verify",
    legacy_slugs: ["punjab-1000-women-allowance"],
    keywords: [
      "1000 women punjab",
      "1000 month punjab women",
      "पंजाब 1000 महिला",
      "1000 rupay mahila punjab",
      "1000 mahila bhatta punjab",
    ],
    jurisdiction: "punjab",
    status: "verify_latest_notification",
    old_name_en: "Proposed ₹1,000/Month Women's Allowance (Punjab)",
    old_name_hi: "प्रस्तावित ₹1,000/माह महिला सम्मान भत्ता (पंजाब)",
    replacement_codes: ["PB-022", "PB-027"],
    alert_title_hi: "🔔 नवीनतम अधिसूचना सत्यापित करें ([VERIFY LATEST NOTIFICATION])",
    alert_title_en: "🔔 Verify Latest Punjab Finance/WCD Notification",
    alert_message_hi:
      "पंजाब में ₹1,000/माह महिला भत्ते की वर्तमान कार्यान्वयन स्थिति हेतु आधिकारिक पंजाब सरकार पोर्टल सत्यापित करें। सक्रिय योजनाएं: PB-022 (माता तृप्ता) व PB-027 (विधवा/निराश्रित पेंशन ₹1,500/माह)।",
    alert_message_en:
      "Verify active status of any ₹1,000/mo allowance with official Punjab WCD/Finance notifications. Active schemes: PB-022 and PB-027.",
  },

  // ---------------- CENTRAL GOVERNMENT ----------------
  {
    id: "central-fame2-replaced",
    legacy_slugs: ["fame-2", "fame-ii"],
    keywords: ["fame-ii", "fame ii", "fame 2", "फेम-2", "फेम 2"],
    jurisdiction: "central",
    status: "discontinued",
    old_name_en: "FAME-II (Faster Adoption and Manufacturing of Electric Vehicles Phase II)",
    old_name_hi: "फेम-II इलेक्ट्रिक वाहन सब्सिडी योजना",
    replacement_codes: ["IN-091"],
    alert_title_hi: "🔄 प्रतिस्थापित → पीएम ई-ड्राइव योजना (PM E-DRIVE — IN-091)",
    alert_title_en: "🔄 Replaced by PM E-DRIVE Scheme (IN-091)",
    alert_message_hi:
      "FAME-II समाप्त हो चुका है और इसकी जगह केंद्रीय भारी उद्योग मंत्रालय की 'पीएम ई-ड्राइव (PM E-DRIVE — IN-091)' योजना लागू है।",
    alert_message_en:
      "FAME-II ended and was replaced by the Ministry of Heavy Industries' PM E-DRIVE scheme (IN-091).",
  },
  {
    id: "central-manf-padho-pardesh-discontinued",
    legacy_slugs: ["manf", "padho-pardesh"],
    keywords: ["manf", "maulana azad national fellowship", "padho pardesh", "पढ़ो परदेश", "मौलाना आजाद फेलोशिप"],
    jurisdiction: "central",
    status: "discontinued",
    old_name_en: "MANF & Padho Pardesh Schemes",
    old_name_hi: "मौलाना आज़ाद नेशनल फेलोशिप (MANF) व पढ़ो परदेश योजना",
    replacement_codes: ["IN-013", "IN-001"],
    alert_title_hi: "⚠️ FY 2022–23 से नए आवेदन हेतु बंद → वैकल्पिक IN-013 व IN-001 देखें",
    alert_title_en: "⚠️ Discontinued from FY 2022–23 → See IN-013 & IN-001",
    alert_message_hi:
      "MANF व पढ़ो परदेश योजनाएं FY 2022–23 से नए छात्रों के लिए बंद हैं। योग्य छात्र IN-013 (NFSC/NFST/NFOBC PhD फेलोशिप) व IN-001 (PM-Vidyalaxmi शिक्षा ऋण) देख सकते हैं।",
    alert_message_en:
      "MANF & Padho Pardesh were discontinued from FY 2022–23. Check IN-013 (PhD Fellowships) or IN-001 (PM-Vidyalaxmi education loan) for active alternatives.",
  },
  {
    id: "central-minority-merged-pm-vikas",
    legacy_slugs: ["seekho-aur-kamao", "usttad", "hamari-dharohar", "nai-roshni", "nai-manzil"],
    keywords: [
      "seekho aur kamao",
      "usttad",
      "hamari dharohar",
      "nai roshni",
      "nai manzil",
      "सीखो और कमाओ",
      "नई मंजिल",
      "नई रोशनी",
    ],
    jurisdiction: "central",
    status: "merged",
    old_name_en: "Seekho Aur Kamao / USTTAD / Hamari Dharohar / Nai Roshni / Nai Manzil",
    old_name_hi: "सीखो और कमाओ / उस्ताद / हमारी धरोहर / नई रोशनी / नई मंज़िल",
    replacement_codes: ["IN-080"],
    alert_title_hi: "🔄 एकीकृत → पीएम-विकास (PM-VIKAS — IN-080)",
    alert_title_en: "🔄 Merged into PM-VIKAS (IN-080)",
    alert_message_hi:
      "अल्पसंख्यक कार्य मंत्रालय की ये पांचों योजनाएं अब एकीकृत 'पीएम-विकास (PM-VIKAS — IN-080)' योजना में समाहित हो चुकी हैं।",
    alert_message_en:
      "Seekho Aur Kamao, USTTAD, Hamari Dharohar, Nai Roshni, and Nai Manzil were merged into PM-VIKAS (IN-080).",
  },
  {
    id: "central-pmvvy-closed",
    legacy_slugs: ["pmvvy"],
    keywords: ["pmvvy", "pradhan mantri vaya vandana yojana lic"],
    jurisdiction: "central",
    status: "discontinued",
    old_name_en: "Pradhan Mantri Vaya Vandana Yojana (PMVVY Pension)",
    old_name_hi: "प्रधानमंत्री वय वंदना योजना (PMVVY पेंशन)",
    replacement_codes: ["IN-036", "IN-016"],
    alert_title_hi: "⚠️ नई खरीद 31 मार्च 2023 को बंद → SCSS (IN-036) व आयुष्मान वय वंदना (IN-016) देखें",
    alert_title_en: "⚠️ Closed 31 Mar 2023 → See SCSS (IN-036) & Vaya Vandana Health Card (IN-016)",
    alert_message_hi:
      "LIC वाली PMVVY पेंशन पॉलिसी 31 मार्च 2023 को नई खरीद के लिए बंद हो गई। वरिष्ठ नागरिक नियमित ब्याज आय हेतु SCSS (IN-036) तथा 70+ मुफ्त इलाज हेतु आयुष्मान वय वंदना कार्ड (IN-016) देखें।",
    alert_message_en:
      "PMVVY LIC pension scheme closed on 31 Mar 2023. For senior savings income use SCSS (IN-036); for 70+ cashless ₹5L hospital cover use Ayushman Vaya Vandana Card (IN-016).",
  },
  {
    id: "central-mssc-window-verify",
    legacy_slugs: ["mssc", "mahila-samman-savings-certificate"],
    keywords: ["mssc", "mahila samman savings certificate", "महिला सम्मान बचत प्रमाणपत्र"],
    jurisdiction: "central",
    status: "verify_latest_notification",
    old_name_en: "Mahila Samman Savings Certificate (MSSC)",
    old_name_hi: "महिला सम्मान बचत प्रमाणपत्र (MSSC)",
    replacement_codes: ["IN-027"],
    alert_title_hi: "🔔 मूल अवधि 31 मार्च 2025 को समाप्त — नवीनतम अधिसूचना जांचें",
    alert_title_en: "🔔 Original Window Closed 31 Mar 2025 — Verify Extension Notice",
    alert_message_hi:
      "MSSC की मूल जमा अवधि 31 मार्च 2025 को समाप्त हुई थी; कृपया डाकघर/वित्त मंत्रालय से किसी विस्तार की नवीनतम अधिसूचना सत्यापित करें। बालिका बचत हेतु SSY (IN-027) सक्रिय है।",
    alert_message_en:
      "Original MSSC subscription window closed on 31 Mar 2025; verify with Ministry of Finance/India Post if any extension exists. SSY (IN-027) remains active.",
  },
  {
    id: "central-pmay-u-1-clss-superseded",
    legacy_slugs: ["pmay-u-clss", "pmay-clss"],
    keywords: ["pmay-u 1.0", "pmay 1.0", "clss subsidy", "pmay clss"],
    jurisdiction: "central",
    status: "merged",
    old_name_en: "PMAY-Urban 1.0 CLSS",
    old_name_hi: "पीएम आवास योजना-शहरी 1.0 CLSS",
    replacement_codes: ["IN-055"],
    alert_title_hi: "🔄 उन्नत संस्करण लागू → पीएम आवास योजना-शहरी 2.0 ISS (IN-055)",
    alert_title_en: "🔄 Superseded by PMAY-Urban 2.0 ISS (IN-055)",
    alert_message_hi:
      "पुरानी PMAY-U 1.0 CLSS की जगह अब 'पीएम आवास योजना-शहरी 2.0 (IN-055)' सक्रिय है (ब्याज सब्सिडी ISS घटक सहित)।",
    alert_message_en:
      "PMAY-U 1.0 CLSS was superseded by PMAY-Urban 2.0 (IN-055) including the Interest Subsidy Scheme (ISS) vertical.",
  },

  // ---------------- LEGACY LOKSAATHI URL ALIASES (ZERO 404 PRESERVATION) ----------------
  {
    id: "legacy-pm-jan-dhan",
    legacy_slugs: ["pm-jan-dhan"],
    keywords: [],
    jurisdiction: "central",
    status: "legacy_alias",
    old_name_en: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
    old_name_hi: "प्रधानमंत्री जन धन योजना (PMJDY)",
    replacement_codes: ["IN-037", "IN-038", "IN-035"],
    alert_title_hi: "🏦 जन धन बैंकिंग सुरक्षा → PMJJBY (IN-037), PMSBY (IN-038) व APY (IN-035)",
    alert_title_en: "🏦 Zero-Balance Banking Protection → PMJJBY (IN-037), PMSBY (IN-038), APY (IN-035)",
    alert_message_hi:
      "बैंक खाता आधार सीडिंग (DBT) हेतु आधिकारिक पोर्टल जन सुरक्षा योजनाओं PMJJBY (IN-037), PMSBY (IN-038) व अटल पेंशन योजना (IN-035) से जुड़ा है।",
    alert_message_en:
      "Banking financial inclusion schemes in the Master Index map to Jan Suraksha & Pension benefits: PMJJBY (IN-037), PMSBY (IN-038), and APY (IN-035).",
  },
  {
    id: "legacy-anganwadi-poshan",
    legacy_slugs: ["anganwadi-services", "poshan-abhiyaan"],
    keywords: [],
    jurisdiction: "central",
    status: "legacy_alias",
    old_name_en: "Anganwadi Services & PM POSHAN Nutrition",
    old_name_hi: "आंगनवाड़ी एवं पोषण अभियान योजना",
    replacement_codes: ["IN-017", "IN-024", "IN-025"],
    alert_title_hi: "🍎 मातृ एवं शिशु पोषण व स्वास्थ्य → PMMVY 2.0 (IN-017), RBSK (IN-024)",
    alert_title_en: "🍎 Maternal & Child Nutrition/Health → PMMVY 2.0 (IN-017), RBSK (IN-024)",
    alert_message_hi:
      "मातृत्व पोषण एवं बाल स्वास्थ्य लाभ PMMVY 2.0 (IN-017), RBSK (IN-024) तथा मिशन इंद्रधनुष (IN-025) में देखे जा सकते हैं।",
    alert_message_en:
      "Maternal and child nutrition/health schemes are mapped under PMMVY 2.0 (IN-017), RBSK (IN-024), and Mission Indradhanush (IN-025).",
  },
  {
    id: "legacy-visvesvaraya-phd",
    legacy_slugs: ["visvesvaraya-phd"],
    keywords: [],
    jurisdiction: "central",
    status: "legacy_alias",
    old_name_en: "Visvesvaraya PhD Scheme (Electronics & IT)",
    old_name_hi: "विश्वेश्वरैया पीएचडी योजना",
    replacement_codes: ["IN-013"],
    alert_title_hi: "🎓 डॉक्टोरल फेलोशिप योजना → राष्ट्रीय फेलोशिप (IN-013)",
    alert_title_en: "🎓 Doctoral Fellowships → NFSC / NFST / NFOBC (IN-013)",
    alert_message_hi:
      "PhD व शोध छात्रवृत्तियां अब राष्ट्रीय फेलोशिप पोर्टल समूह (IN-013) व उच्च शिक्षा छात्रवृत्तियों (IN-012) में समूहीकृत हैं।",
    alert_message_en:
      "Doctoral fellowships are consolidated in the Central Education index under IN-013 (NFSC/NFST/NFOBC Fellowships) and IN-012.",
  },
];

/**
 * Matches user search queries, chat messages, or slugs against discontinued,
 * merged, viral/fake, or verify-latest redirect rules.
 */
export function detectSchemeRedirect(queryOrText: string): SchemeRedirectEntry | null {
  if (!queryOrText || typeof queryOrText !== "string") return null;
  const normalized = queryOrText.toLowerCase().trim();
  if (!normalized) return null;

  // Check exact legacy slug first
  const slugMatch = SCHEME_REDIRECTS.find((entry) =>
    entry.legacy_slugs.some((slug) => normalized === slug.toLowerCase())
  );
  if (slugMatch) return slugMatch;

  // Disambiguate active "Haryana Ladli Social Security Allowance" before checking Delhi Ladli (2008)
  if (
    (normalized.includes("haryana") || normalized.includes("हरियाणा")) &&
    (normalized.includes("social security") || normalized.includes("bhatta") || normalized.includes("भत्ता"))
  ) {
    return null;
  }

  // Check viral / fake & discontinued keywords (longest keyword phrases first for precision)
  const sortedEntries = [...SCHEME_REDIRECTS].sort((a, b) => {
    const maxA = Math.max(0, ...a.keywords.map((k) => k.length));
    const maxB = Math.max(0, ...b.keywords.map((k) => k.length));
    return maxB - maxA;
  });

  for (const entry of sortedEntries) {
    for (const kw of entry.keywords) {
      if (kw && normalized.includes(kw.toLowerCase())) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Resolves a URL parameter slug cleanly against the redirect registry.
 */
export function getRedirectByLegacySlug(slug: string): SchemeRedirectEntry | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  return (
    SCHEME_REDIRECTS.find(
      (entry) =>
        entry.id.toLowerCase() === clean ||
        entry.legacy_slugs.some((s) => s.toLowerCase() === clean)
    ) || null
  );
}
