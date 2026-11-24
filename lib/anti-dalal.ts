import type { Scheme, AntiDalalRules } from "./scheme-types";

export interface ResolvedAntiDalalInfo {
  officialFeeLabel: string;
  cscFeeNote: string;
  processingTimeline: string;
  receiptRule: string;
  antiDalalWarning: string;
  helpline: string;
  centerName: string;
  mapsSearchUrl: string;
  officialPortalUrl: string;
  audioSpeechText: string;
  whatsappShareText: string;
}

interface StateAntiDalalDefaults {
  centerName: { hi: string; en: string };
  mapsQuery: string;
  helpline: string;
  timeline: { hi: string; en: string };
  cscFeeNote: { hi: string; en: string };
}

const STATE_DEFAULTS: Record<string, StateAntiDalalDefaults> = {
  punjab: {
    centerName: {
      hi: "ਸੇਵਾ ਕੇਂਦਰ (Sewa Kendra)",
      en: "Punjab Sewa Kendra",
    },
    mapsQuery: "Sewa Kendra near me",
    helpline: "1100", // Punjab CM Helpline & Right to Service
    timeline: {
      hi: "15 से 30 कार्य दिवस (RTS कानून अनुसार)",
      en: "15 to 30 working days (Under RTS Act)",
    },
    cscFeeNote: {
      hi: "अधिकतम ₹30–₹50 (केवल यदि सेवा केंद्र ऑपरेटर से फॉर्म भरवाएं)",
      en: "Max ₹30–₹50 (standard operator facilitation fee if applying at Sewa Kendra)",
    },
  },
  up: {
    centerName: {
      hi: "जन सेवा केंद्र (Jan Seva Kendra / CSC)",
      en: "Jan Seva Kendra / CSC (UP)",
    },
    mapsQuery: "Jan Seva Kendra CSC near me",
    helpline: "1076", // UP CM Helpline
    timeline: {
      hi: "15 से 30 कार्य दिवस (ई-डिस्ट्रिक्ट सिटीजन चार्टर)",
      en: "15 to 30 working days (e-District Citizen Charter)",
    },
    cscFeeNote: {
      hi: "अधिकतम ₹30 (अधिकृत सरकारी सेवा शुल्क)",
      en: "Max ₹30 (official authorized service charge)",
    },
  },
  haryana: {
    centerName: {
      hi: "अंत्योदय सरल केंद्र (Saral Kendra)",
      en: "Antyodaya Saral Kendra (Haryana)",
    },
    mapsQuery: "Saral Kendra Antyodaya near me",
    helpline: "1800-180-2087", // Saral Toll-Free
    timeline: {
      hi: "7 से 21 कार्य दिवस (राइट टू सर्विस आयोग अनुसार)",
      en: "7 to 21 working days (Right to Service Commission)",
    },
    cscFeeNote: {
      hi: "अधिकतम ₹30–₹50 (सरल केंद्र आधिकारिक शुल्क)",
      en: "Max ₹30–₹50 (authorized Saral Kendra service fee)",
    },
  },
  delhi: {
    centerName: {
      hi: "नागरिक सुविधा केंद्र (CFC / e-District)",
      en: "Citizen Facilitation Centre (Delhi e-District)",
    },
    mapsQuery: "Citizen Facilitation Centre eDistrict Delhi near me",
    helpline: "1076", // Delhi Doorstep Delivery / Helpline
    timeline: {
      hi: "7 से 15 कार्य दिवस (दिल्ली नागरिक घोषणा पत्र)",
      en: "7 to 15 working days (Citizen Charter)",
    },
    cscFeeNote: {
      hi: "अधिकतम ₹50 (अथवा 1076 पर कॉल कर घर बैठे निःशुल्क/न्यूनतम शुल्क सेवा)",
      en: "Max ₹50 (or dial 1076 for doorstep delivery)",
    },
  },
  central: {
    centerName: {
      hi: "सीएससी जन सेवा केंद्र (CSC Common Service Centre)",
      en: "CSC Common Service Centre",
    },
    mapsQuery: "CSC Common Service Centre near me",
    helpline: "14599", // National CSC Helpline
    timeline: {
      hi: "15 से 30 कार्य दिवस (मानक सरकारी समय-सीमा)",
      en: "15 to 30 working days (Standard Govt Window)",
    },
    cscFeeNote: {
      hi: "अधिकतम ₹30–₹50 (सामान्य सीएससी ऑपरेटर सेवा शुल्क)",
      en: "Max ₹30–₹50 (nominal CSC operator assistance fee)",
    },
  },
};

/**
 * Generates an instant, zero-cost Google Maps search URL for the citizen's nearest
 * government service center (Sewa Kendra, Jan Seva Kendra, Saral Kendra, CSC).
 */
export function getNearbyCenterMapsUrl(state?: string, customQuery?: string): string {
  const query =
    customQuery ||
    (state && STATE_DEFAULTS[state.toLowerCase()]
      ? STATE_DEFAULTS[state.toLowerCase()].mapsQuery
      : STATE_DEFAULTS.central.mapsQuery);

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Resolves comprehensive, verified Anti-Dalal information for any scheme with
 * fail-safe smart defaults, bilingual text, audio transcript, and WhatsApp share copy.
 */
export function resolveAntiDalalInfo(
  scheme: Scheme,
  language: "hi" | "en" = "hi"
): ResolvedAntiDalalInfo {
  const stateKey = scheme.state ? scheme.state.toLowerCase() : "central";
  const defaults = STATE_DEFAULTS[stateKey] || STATE_DEFAULTS.central;
  const custom: AntiDalalRules = scheme.anti_dalal || {};

  // 1. Official Application Fee
  let officialFeeLabel: string;
  if (language === "hi") {
    officialFeeLabel =
      custom.fee_label_hi ||
      (custom.official_fee_inr !== undefined && custom.official_fee_inr > 0
        ? `₹${custom.official_fee_inr} (आधिकारिक सरकारी शुल्क)`
        : "₹0 (निःशुल्क सरकारी पोर्टल आवेदन)");
  } else {
    officialFeeLabel =
      custom.fee_label_en ||
      (custom.official_fee_inr !== undefined && custom.official_fee_inr > 0
        ? `₹${custom.official_fee_inr} (Official government fee)`
        : "₹0 (Free on official government portal)");
  }

  // 2. CSC/Operator Service Fee
  const cscFeeNote =
    (language === "hi" ? custom.csc_fee_note_hi : custom.csc_fee_note_en) ||
    (language === "hi" ? defaults.cscFeeNote.hi : defaults.cscFeeNote.en);

  // 3. Processing Timeline
  const processingTimeline =
    (language === "hi" ? custom.timeline_hi : custom.timeline_en) ||
    (language === "hi" ? defaults.timeline.hi : defaults.timeline.en);

  // 4. Receipt (Acknowledgement Slip) Rule
  const receiptRule =
    (language === "hi" ? custom.receipt_rule_hi : custom.receipt_rule_en) ||
    (language === "hi"
      ? "आवेदन के बाद ऑपरेटर से पक्की रसीद (Acknowledgement Slip) व संदर्भ संख्या (Application ID) ज़रूर लें — बिना रसीद ₹1 भी न दें!"
      : "Always collect your official acknowledgement slip and application reference number after submission — never pay without a receipt!");

  // 5. Anti-Dalal Warning
  const antiDalalWarning =
    (language === "hi" ? custom.anti_dalal_warning_hi : custom.anti_dalal_warning_en) ||
    (language === "hi"
      ? "दलालों से सावधान: कोई भी एजेंट 'पैसे लेकर गारंटी से योजना पास कराने' या 'सर्वर डाउन' का झांसा दे तो पैसे न दें। योजना केवल पात्रता पर स्वीकृत होती है।"
      : "Anti-Dalal Alert: Never pay middlemen claiming 'guaranteed fast approval' or 'server setting'. Welfare schemes are approved strictly on factual eligibility.");

  // 6. Helpline & Centers
  const helpline = custom.helpline || defaults.helpline;
  const centerName =
    (language === "hi" ? custom.center_name_hi : custom.center_name_en) ||
    (language === "hi" ? defaults.centerName.hi : defaults.centerName.en);

  const mapsSearchUrl = getNearbyCenterMapsUrl(
    scheme.state,
    custom.center_search_query
  );

  const officialPortalUrl = scheme.apply_url || scheme.source_url;

  // 7. Natural Speech Text for Audio Playback ("Suno")
  const audioSpeechText =
    language === "hi"
      ? `एंटी-दलाल सुरक्षा कवच। ${scheme.name.hi} के लिए सरकारी पोर्टल फीस शून्य रुपये है। यदि आप जन सेवा केंद्र या सेवा केंद्र से फॉर्म भरवाते हैं, तो सामान्य शुल्क केवल तीस से पचास रुपये है। आवेदन करने के तुरंत बाद पावती रसीद और आवेदन संख्या ज़रूर लें। बिना रसीद किसी को भी पैसे न दें। सामान्य समय सीमा पंद्रह से तीस कार्य दिवस है। किसी भी शिकायत के लिए हेल्पलाइन नंबर ${helpline} पर कॉल करें।`
      : `Anti-Dalal Citizen Shield for ${scheme.name.en}. Official portal application fee is zero rupees. If applying through a Common Service Centre or Sewa Kendra, nominal fee is only thirty to fifty rupees. Always collect your official acknowledgement slip and application number. Never pay without a valid receipt. Expected processing time is fifteen to thirty working days. For complaints, dial helpline ${helpline}.`;

  // 8. Pre-formatted WhatsApp Share Text
  const schemeTitle = language === "hi" ? scheme.name.hi : scheme.name.en;
  const whatsappShareText =
    language === "hi"
      ? `🛡️ *दलालों से सावधान — ${schemeTitle}*\n\n` +
        `💰 *सरकारी पोर्टल फीस:* ${officialFeeLabel}\n` +
        `🏢 *जन सेवा केंद्र (CSC) शुल्क:* ${cscFeeNote}\n` +
        `⏱️ *समय-सीमा:* ${processingTimeline}\n` +
        `🧾 *पक्की रसीद नियम:* आवेदन के बाद ऑपरेटर से रसीद (Acknowledgement ID) ज़रूर लें। बिना रसीद पैसे न दें।\n` +
        `📞 *हेल्पलाइन:* ${helpline}\n` +
        `🌐 *आधिकारिक पोर्टल:* ${officialPortalUrl}\n\n` +
        `✅ *लोकसाथी पर पात्रता जांचें:* https://lok-saathi.vercel.app/schemes/${scheme.id}`
      : `🛡️ *Zero-Middleman Citizen Shield — ${schemeTitle}*\n\n` +
        `💰 *Official Fee:* ${officialFeeLabel}\n` +
        `🏢 *CSC Service Fee:* ${cscFeeNote}\n` +
        `⏱️ *Timeline:* ${processingTimeline}\n` +
        `🧾 *Receipt Rule:* Always collect your official acknowledgement slip before paying any nominal CSC fee.\n` +
        `📞 *Helpline:* ${helpline}\n` +
        `🌐 *Official Portal:* ${officialPortalUrl}\n\n` +
        `✅ *Check Eligibility on LokSaathi:* https://lok-saathi.vercel.app/schemes/${scheme.id}`;

  return {
    officialFeeLabel,
    cscFeeNote,
    processingTimeline,
    receiptRule,
    antiDalalWarning,
    helpline,
    centerName,
    mapsSearchUrl,
    officialPortalUrl,
    audioSpeechText,
    whatsappShareText,
  };
}
