/**
 * Centralized Bilingual (Hindi & English) text resources for LokSaathi Onboarding,
 * Device Diagnostics, and Help Center.
 */

export const ONBOARDING_CONTENT = {
  hi: {
    skip: "छोड़ें",
    next: "आगे बढ़ें",
    back: "पीछे जाएं",
    finish: "शुरू करें",
    listen: "सुनें",
    stop: "रोकें",
    stepCount: "कदम",
    steps: [
      {
        id: "welcome",
        badge: "स्वागत है",
        title: "लोकसाथी में आपका स्वागत है",
        subtitle: "सरकारी योजनाओं और दस्तावेज़ों को समझने का आपका अपना सच्चा डिजिटल साथी।",
        audioText:
          "नमस्ते! लोकसाथी में आपका स्वागत है। यहाँ आप अपनी भाषा में बोलकर या लिखकर सरकारी योजनाओं की जानकारी पा सकते हैं और किसी भी सरकारी नोटिस या फॉर्म को आसानी से समझ सकते हैं।",
        bulletPoints: [
          "100% निःशुल्क और आम नागरिक के लिए समर्पित",
          "हिंदी और अंग्रेज़ी दोनों भाषाओं में उपलब्ध",
          "ऑफ़लाइन काम करता है और आपका डेटा निजी रखता है",
        ],
      },
      {
        id: "schemes",
        badge: "योजनाएं खोजें",
        title: "योजनाएं खोजने के 2 आसान तरीके",
        subtitle: "आप अपनी सुविधा के अनुसार इनमें से कोई भी तरीका चुन सकते हैं:",
        audioText:
          "योजनाएं खोजने के दो आसान तरीके हैं। पहला, सीधी खोज सूची जहाँ बिना किसी इंतज़ार के तुरंत सारी योजनाएं फ़िल्टर कर सकते हैं। दूसरा, एआई सहायक जहाँ आप बोलकर अपनी पात्रता जान सकते हैं।",
        card1: {
          title: "1. सभी योजनाएं (सीधी खोज)",
          desc: "बिना किसी इंतज़ार के तुरंत 35+ केंद्रीय व राज्य योजनाओं की सूची देखें और राज्य या वर्ग के अनुसार फ़िल्टर करें।",
          tag: "⚡ 0 सेकंड इंतज़ार • ₹0 डेटा",
        },
        card2: {
          title: "2. एआई सहायक (AI Sahayak)",
          desc: "माइक दबाकर अपनी बात बोलें—जैसे 'मैं दिल्ली का छात्र हूँ'—और सहायक आपकी पात्रता समझकर योजनाएं बताएगा।",
          tag: "🎙️ आवाज व चैट द्वारा",
        },
      },
      {
        id: "documents",
        badge: "दस्तावेज़ व फॉर्म",
        title: "सरकारी नोटिस व फॉर्म आसानी से समझें",
        subtitle: "किसी भी जटिल सरकारी पत्र या खाली फॉर्म की फोटो खींचें:",
        audioText:
          "दस्तावेज़ सेक्शन में आप किसी भी सरकारी नोटिस, बिजली बिल या रिजेक्शन लेटर की फोटो खींचकर उसका सरल हिंदी अर्थ समझ सकते हैं। खाली फॉर्म भरने के लिए क्रमबद्ध गाइड भी मिलती है। फोटो अपलोड करने से पहले काली पट्टी से अपना आधार या पैन नंबर ज़रूर छुपा लें।",
        card1: {
          title: "नोटिस / पत्र समझें",
          desc: "सरकारी चिट्ठी, बिजली बिल या रिजेक्शन लेटर की फोटो अपलोड करें और आसान भाषा में मतलब, अंतिम तारीख व चेतावनी जानें।",
        },
        card2: {
          title: "खाली फॉर्म कैसे भरें (गाइड)",
          desc: "आवेदन पत्र की फोटो खींचें—लोकसाथी आपको बॉक्स-दर-बॉक्स बताएगा कि किस खाने में क्या लिखना है।",
        },
        privacyNote: "🔒 सुरक्षा ब्रश: फोटो अपलोड करने से पहले अपनी उंगली से आधार या पैन नंबर पर काली पट्टी खींचकर छुपा सकते हैं।",
      },
      {
        id: "readiness",
        badge: "डिवाइस तैयारी",
        title: "अपने डिवाइस को 100% तैयार करें",
        subtitle: "बेहतर अनुभव के लिए ऐप को अपने फोन या कंप्यूटर पर जोड़ें:",
        audioText:
          "लोकसाथी को अपने होम स्क्रीन पर ऐप की तरह इंस्टॉल करें ताकि यह बिना इंटरनेट भी चल सके। माइक और कैमरा की अनुमति दें ताकि आवाज से बातचीत और फोटो स्कैन ठीक से काम करें।",
        checks: [
          { label: "ऐप इंस्टॉल करें (PWA)", desc: "होम स्क्रीन पर जोड़ें, बिना इंटरनेट सहेजी योजनाएं खुलेंगी" },
          { label: "माइक व कैमरा एक्सेस", desc: "आवाज से बोलने और नोटिस की फोटो लेने के लिए आवश्यक" },
          { label: "सुनें (Audio) सुविधा", desc: "कम पढ़े-लिखे नागरिकों के लिए पढ़कर सुनाने की सुविधा" },
        ],
        helpLinkText: "विस्तृत डिवाइस सेटअप व मदद केंद्र खोलें →",
      },
    ],
  },
  en: {
    skip: "Skip",
    next: "Next",
    back: "Back",
    finish: "Get Started",
    listen: "Listen",
    stop: "Stop",
    stepCount: "Step",
    steps: [
      {
        id: "welcome",
        badge: "Welcome",
        title: "Welcome to LokSaathi",
        subtitle: "Your trusted digital companion to discover, understand, and claim government welfare schemes.",
        audioText:
          "Welcome to LokSaathi. Speak or type in your language to discover government schemes you qualify for and understand official notices and application forms simply.",
        bulletPoints: [
          "100% Free and built for every Indian citizen",
          "Available in both Hindi and English",
          "Works offline and keeps your sensitive data private",
        ],
      },
      {
        id: "schemes",
        badge: "Find Schemes",
        title: "2 Easy Ways to Find Schemes",
        subtitle: "Choose the method that works best for you:",
        audioText:
          "You can find schemes in two simple ways. First, the Direct Catalog where you can instantly search and filter over 35 central and state schemes. Second, the AI Assistant where you can speak or type to check your eligibility.",
        card1: {
          title: "1. Direct Scheme Catalog",
          desc: "Instantly browse 35+ verified Central & State schemes with zero waiting time. Filter by State or Category.",
          tag: "⚡ Instant • Zero API wait",
        },
        card2: {
          title: "2. AI Assistant (AI Sahayak)",
          desc: "Tap the mic and speak naturally—e.g. 'I am a farmer in Punjab'—and LokSaathi will recommend matching schemes.",
          tag: "🎙️ Voice & Chat",
        },
      },
      {
        id: "documents",
        badge: "Document Helper",
        title: "Understand Notices & Forms Simply",
        subtitle: "Photograph any official notice or blank application form:",
        audioText:
          "In the Document section, take a photo of any official notice, bill, or rejection letter to understand deadlines and action items. For blank forms, get a box-by-box filling guide. Before uploading, use the privacy brush to black out your Aadhaar or PAN number.",
        card1: {
          title: "Understand Notice / Letter",
          desc: "Photograph official letters, utility bills, or rejection notices to get plain-language summaries, deadlines, and precautions.",
        },
        card2: {
          title: "Blank Form Filling Guide",
          desc: "Scan a blank application form to receive an ordered, box-by-box guide on what to write and which document to copy from.",
        },
        privacyNote: "🔒 Privacy Brush: Drag your finger or mouse over your Aadhaar or PAN number to permanently redact sensitive digits before upload.",
      },
      {
        id: "readiness",
        badge: "Device Setup",
        title: "Ensure Your Device is 100% Ready",
        subtitle: "Get the best experience on your phone, tablet, or desktop:",
        audioText:
          "Install LokSaathi as an app on your home screen for quick offline access. Allow microphone and camera permissions so you can talk to the assistant and scan documents smoothly.",
        checks: [
          { label: "Install as App (PWA)", desc: "Add to home screen; open saved schemes even without internet" },
          { label: "Mic & Camera Access", desc: "Required for voice conversation and capturing document photos" },
          { label: "Audio Playback (Suno)", desc: "Reads explanations out loud for users who prefer listening" },
        ],
        helpLinkText: "Open Full Device Setup & Help Center →",
      },
    ],
  },
};

export const HELP_CONTENT = {
  hi: {
    pageTitle: "मदद और डिवाइस सेटअप केंद्र",
    pageSubtitle: "अपने फोन या कंप्यूटर पर लोकसाथी को 100% सुचारू चलाने की पूरी जानकारी।",
    tourButton: "टूर दोबारा देखें (Replay Tour)",
    detectedOSBanner: "पहचाना गया डिवाइस:",
    readinessTitle: "1-टैप डिवाइस तत्परता जांच (Live Readiness Test)",
    readinessDesc: "जांचें कि आपके डिवाइस पर कैमरा, माइक और ऑडियो ठीक से काम कर रहे हैं या नहीं:",
    osTabsTitle: "अपने ऑपरेटिंग सिस्टम के अनुसार निर्देश चुनें:",
    tests: {
      pwa: {
        title: "ऐप इंस्टॉलेशन स्थिति",
        installed: "✅ लोकसाथी ऐप के रूप में स्थापित है (Standalone PWA)",
        notInstalled: "⚠️ ब्राउज़र में खुला है — होम स्क्रीन पर जोड़ें",
      },
      media: {
        title: "कैमरा और माइक्रोफ़ोन",
        button: "अनुमति जांचें (Test Access)",
        testing: "जांच जारी है...",
        allowed: "✅ कैमरा और माइक दोनों उपलब्ध हैं",
        blocked: "⚠️ अनुमति रुकी हुई है — नीचे दिए गए निर्देश देखें",
      },
      audio: {
        title: "हिंदी आवाज / ऑडियो (Suno)",
        button: "आवाज चलाकर देखें (Test Sound)",
        playing: "ऑडियो बज रहा है...",
        success: "✅ ऑडियो प्रणाली सक्रिय है",
        missingVoice: "⚠️ हिंदी आवाज नहीं मिली (Google TTS इंस्टॉल करें)",
      },
      offline: {
        title: "ऑफ़लाइन भंडारण (Cache)",
        ready: "✅ ऑफ़लाइन स्टोरेज तैयार है (बिना इंटरनेट सहेजी योजनाएं खुलेंगी)",
        notReady: "⚠️ ऑफ़लाइन कैश सक्रिय नहीं है",
      },
    },
    byok: {
      title: "निःशुल्क Gemini API Key गाइड (वैकल्पिक)",
      badge: "हमेशा मुफ़्त",
      subtitle: "लोकसाथी की सीधी योजना खोज 100% मुफ़्त है। यदि कभी भारी लोड हो, तो आप अपनी निजी निःशुल्क Key जोड़ सकते हैं।",
      steps: [
        "aistudio.google.com/app/apikey पर जाएं और अपने Google खाते से लॉगिन करें।",
        "'Create API Key' बटन पर क्लिक करके एक सेकंड में मुफ़्त Key बनाएं।",
        "कुंजी को कॉपी करें (यह हमेशा 'AIzaSy' से शुरू होती है)।",
        "ऊपर 'API Key जोड़ें' बटन दबाकर इसे सहेज लें। यह केवल आपके ब्राउज़र में सुरक्षित रहेगी।",
      ],
      openModalBtn: "🔑 अपनी API Key जोड़ें या बदलें",
    },
    faqs: [
      {
        q: "माइक काम नहीं कर रहा है या आवाज नहीं सुन पा रहा?",
        a: "अपने ब्राउज़र के एड्रेस बार में 🔒 (लॉक) आइकॉन पर टैप करें, 'Permissions' या 'Site Settings' में जाएं और Microphone को 'Allow' (अनुमति दें) करें। यदि आप iOS Safari पर हैं, तो Settings > Safari > Microphone में जाकर Allow चुनें।",
      },
      {
        q: "'सुनें' (Audio) बटन दबाने पर आवाज नहीं आ रही?",
        a: "जांचें कि फोन म्यूट या साइलेंट पर तो नहीं है। कुछ एंड्रॉयड फोन (जैसे Redmi, Xiaomi, Poco, Vivo) में हिंदी टेक्स्ट-टू-स्पीच पहले से चालू नहीं होता। फोन की Settings > Accessibility > Text-to-Speech में जाकर 'Speech Recognition and Synthesis from Google' चुनें और हिंदी भाषा डाउनलोड करें।",
      },
      {
        q: "दस्तावेज़ की फोटो साफ नहीं आ रही या स्कैन नहीं हो रहा?",
        a: "दस्तावेज़ को अच्छी रोशनी में किसी सपाट मेज पर रखें। फोटो खींचते समय कैमरा स्थिर रखें। अपलोड करने से पहले उंगली से आधार या पैन नंबर पर काली पट्टी खींचना न भूलें।",
      },
      {
        q: "क्या यह ऐप बिना इंटरनेट के भी काम करता है?",
        a: "हाँ! एक बार होम स्क्रीन पर इंस्टॉल करने के बाद आप 'सहेजी गई' (Saved) योजनाओं को हवाई जहाज मोड (Airplane Mode) या बिना इंटरनेट के कभी भी देख सकते हैं।",
      },
      {
        q: "क्या मेरा आधार नंबर या फोटो कहीं सर्वर पर सेव होती है?",
        a: "बिल्कुल नहीं! जब आप उंगली से आधार नंबर पर काली पट्टी खींचते हैं, तो वह हिस्सा ब्राउज़र में ही स्थायी रूप से मिटा दिया जाता है। लोकसाथी आपका कोई भी आधार नंबर या निजी दस्तावेज़ अपने सर्वर पर स्टोर नहीं करता।",
      },
    ],
  },
  en: {
    pageTitle: "Help & Device Setup Center",
    pageSubtitle: "Everything you need to ensure LokSaathi runs 100% smoothly across Android, iOS, Windows, Mac, and Linux.",
    tourButton: "Replay App Guide",
    detectedOSBanner: "Detected Device:",
    readinessTitle: "1-Tap Device Readiness Test",
    readinessDesc: "Quickly verify if your microphone, camera, and audio playback are ready to use:",
    osTabsTitle: "Choose setup instructions for your Operating System:",
    tests: {
      pwa: {
        title: "App Installation Status",
        installed: "✅ Installed as an App (Standalone PWA)",
        notInstalled: "⚠️ Running in Browser — Add to Home Screen for best experience",
      },
      media: {
        title: "Microphone & Camera Access",
        button: "Test Permissions",
        testing: "Checking access...",
        allowed: "✅ Camera and Microphone are ready",
        blocked: "⚠️ Access is blocked — see OS instructions below",
      },
      audio: {
        title: "Audio Playback (Suno)",
        button: "Play Test Sound",
        playing: "Playing sound...",
        success: "✅ Audio output is active and working",
        missingVoice: "⚠️ Hindi voice not found (Install Google TTS voice)",
      },
      offline: {
        title: "Offline Storage & Cache",
        ready: "✅ Offline storage ready (Saved schemes open without internet)",
        notReady: "⚠️ Offline cache not yet initialized",
      },
    },
    byok: {
      title: "Optional Free Gemini API Key (BYOK)",
      badge: "100% Free",
      subtitle: "Direct Scheme search is always 100% free with no key required. You can optionally add your own free key for unlimited AI scans during high-traffic hours.",
      steps: [
        "Visit aistudio.google.com/app/apikey and sign in with your Google account.",
        "Click 'Create API Key' to generate a free key instantly.",
        "Copy the key (it always begins with 'AIzaSy').",
        "Tap the 'Add API Key' button above and save it. It remains stored exclusively on your device.",
      ],
      openModalBtn: "🔑 Add or Update Your Private API Key",
    },
    faqs: [
      {
        q: "Microphone is not responding or capturing speech?",
        a: "Tap the 🔒 (lock) icon in your browser's address bar, navigate to 'Site settings' or 'Permissions', and set Microphone to 'Allow'. On iOS Safari, open Settings > Safari > Microphone and select 'Allow'.",
      },
      {
        q: "No sound is coming from the 'Listen / Suno' button?",
        a: "Check if your device volume is up and ringer switch is unmuted. On budget Android devices (Xiaomi, Poco, Vivo), open Settings > Accessibility > Text-to-Speech output, ensure 'Speech Recognition and Synthesis from Google' is selected, and download the Hindi voice pack.",
      },
      {
        q: "Document photo is unclear or failing to scan?",
        a: "Place the notice or bill flat on a table under good lighting. Hold your device steady. Remember to drag your finger over sensitive numbers (Aadhaar/PAN) before scanning.",
      },
      {
        q: "Can I use LokSaathi without an internet connection?",
        a: "Yes! Once installed on your home screen, you can browse all your 'Saved Schemes' even in Airplane Mode or in low-connectivity rural areas.",
      },
      {
        q: "Is my Aadhaar number or document stored on your servers?",
        a: "Never! When you draw black boxes with your finger over sensitive details, those pixels are permanently removed inside your device's browser canvas before upload. LokSaathi never stores your Aadhaar or personal files.",
      },
    ],
  },
};

export const OS_SETUP_GUIDES = {
  android: {
    title: { hi: "एंड्रॉयड फोन (Android Setup)", en: "Android Setup Guide" },
    pwaSteps: {
      hi: [
        "Google Chrome में lok-saathi.vercel.app खोलें।",
        "स्क्रीन के नीचे 'लोकसाथी ऐप इंस्टॉल करें' बैनर पर 'इंस्टॉल करें' दबाएं।",
        "यदि बैनर न दिखे, तो ऊपर दाईं ओर 3-डॉट्स (⋮) पर टैप करें और 'Install app' या 'Add to Home screen' चुनें।",
      ],
      en: [
        "Open lok-saathi.vercel.app in Google Chrome.",
        "Tap 'Install App' on the bottom banner.",
        "Or tap the top-right 3 dots (⋮) and select 'Install app' or 'Add to Home screen'.",
      ],
    },
    permSteps: {
      hi: [
        "Chrome में एड्रेस बार के 🔒 (लॉक) या ⚙️ आइकन पर टैप करें।",
        "'Permissions' में जाएं और Microphone व Camera को 'Allow' करें।",
      ],
      en: [
        "Tap the 🔒 (lock) icon in Chrome's address bar.",
        "Go to 'Permissions' and toggle both Microphone and Camera to 'Allow'.",
      ],
    },
    ttsSteps: {
      hi: [
        "Settings > Additional Settings > Accessibility > Text-to-Speech output में जाएं।",
        "Preferred engine में 'Speech Recognition and Synthesis from Google' चुनें।",
        "Settings आइकन पर टैप करके 'Install voice data' में हिंदी डाउनलोड करें।",
      ],
      en: [
        "Go to Phone Settings > Accessibility > Text-to-Speech output.",
        "Select 'Speech Recognition and Synthesis from Google' as the preferred engine.",
        "Tap settings and download Hindi under 'Install voice data'.",
      ],
    },
  },
  ios: {
    title: { hi: "एप्पल आईफोन (iPhone / iPad iOS Setup)", en: "Apple iOS (iPhone/iPad) Setup Guide" },
    pwaSteps: {
      hi: [
        "लोकसाथी को सिर्फ Safari ब्राउज़र में खोलें (Chrome में iOS होम स्क्रीन PWA सपोर्ट नहीं करता)।",
        "नीचे दिए गए शेयर बटन 📤 (Share Icon) पर टैप करें।",
        "नीचे स्क्रॉल करके 'Add to Home Screen' (होम स्क्रीन पर जोड़ें) चुनें और 'Add' दबाएं।",
      ],
      en: [
        "Open lok-saathi.vercel.app in Apple Safari (iOS requires Safari for home screen installation).",
        "Tap the 📤 (Share) icon on the bottom toolbar.",
        "Scroll down and tap 'Add to Home Screen', then tap 'Add' in the top right.",
      ],
    },
    permSteps: {
      hi: [
        "iPhone की मुख्य 'Settings' ऐप खोलें।",
        "नीचे स्क्रॉल करके 'Safari' पर टैप करें, फिर 'Camera' और 'Microphone' को 'Allow' या 'Ask' पर सेट करें।",
      ],
      en: [
        "Open your iPhone 'Settings' app.",
        "Scroll down to 'Safari' > 'Camera' & 'Microphone', and select 'Allow' or 'Ask'.",
      ],
    },
    ttsSteps: {
      hi: [
        "iPhone में हिंदी आवाज पहले से उपलब्ध होती है।",
        "सुनिश्चित करें कि फोन का साइलेंट/रिंगर स्विच अनम्यूट (Silent Off) हो।",
      ],
      en: [
        "iOS includes built-in Hindi and Indian English speech synthesis.",
        "Ensure your physical silent switch is flipped off and volume is up.",
      ],
    },
  },
  windows: {
    title: { hi: "विंडोज कंप्यूटर (Windows PC / Laptop Setup)", en: "Windows PC & Laptop Setup Guide" },
    pwaSteps: {
      hi: [
        "Google Chrome या Microsoft Edge ब्राउज़र में लोकसाथी खोलें।",
        "एड्रेस बार में दाईं ओर दिखने वाले 💻 (कंप्यूटर + तीर) इंस्टॉल आइकन पर क्लिक करें।",
        "'Install' पर क्लिक करें। लोकसाथी आपके डेस्कटॉप और स्टार्ट मेन्यू में ऐप की तरह जुड़ जाएगा।",
      ],
      en: [
        "Open lok-saathi.vercel.app in Google Chrome or Microsoft Edge.",
        "Click the install icon (computer with down arrow 💻) in the right side of the address bar.",
        "Click 'Install'. LokSaathi will launch in its own standalone window and appear in your Start Menu.",
      ],
    },
    permSteps: {
      hi: [
        "एड्रेस बार में वेबसाइट नाम के पास 🔒 लॉक आइकन पर क्लिक करें।",
        "Microphone और Camera दोनों को 'On' (अनुमति) करें।",
      ],
      en: [
        "Click the 🔒 lock icon beside the URL in the address bar.",
        "Toggle both Microphone and Camera permissions to 'Allow'.",
      ],
    },
    ttsSteps: {
      hi: [
        "Windows Settings > Time & Language > Speech में जाएं।",
        "Manage voices में 'Add voices' पर क्लिक करके 'Hindi (India)' डाउनलोड करें।",
      ],
      en: [
        "Open Windows Settings > Time & Language > Speech.",
        "Under Manage voices, click 'Add voices' and install 'Hindi (India)'.",
      ],
    },
  },
  macos: {
    title: { hi: "एप्पल मैक (macOS Setup)", en: "Apple Mac (macOS) Setup Guide" },
    pwaSteps: {
      hi: [
        "Safari में File > Add to Dock पर क्लिक करें, या Chrome में एड्रेस बार के इंस्टॉल आइकन पर क्लिक करें।",
        "लोकसाथी सीधे आपके Mac डॉक और Launchpad में ऐप की तरह आ जाएगा।",
      ],
      en: [
        "In Safari, click File > Add to Dock. In Chrome, click the Install icon in the address bar.",
        "LokSaathi will be added to your Mac Dock and Launchpad as a standalone application.",
      ],
    },
    permSteps: {
      hi: [
        "System Settings > Privacy & Security > Microphone / Camera में Safari या Chrome को अनुमति दें।",
      ],
      en: [
        "Open Mac System Settings > Privacy & Security > Microphone / Camera and allow your browser.",
      ],
    },
    ttsSteps: {
      hi: [
        "System Settings > Accessibility > Spoken Content में जाकर 'System voice' में भारतीय आवाज़ें देख सकते हैं।",
      ],
      en: [
        "Go to System Settings > Accessibility > Spoken Content to manage voices.",
      ],
    },
  },
  linux: {
    title: { hi: "लिनक्स कंप्यूटर (Linux Setup)", en: "Linux Desktop Setup Guide" },
    pwaSteps: {
      hi: [
        "Chrome, Chromium या Brave में एड्रेस बार के दाईं ओर इंस्टॉल आइकन पर क्लिक करें।",
        "ऐप आपके एप्लिकेशन लॉन्चर (GNOME / KDE) में जुड़ जाएगी।",
      ],
      en: [
        "In Chrome, Chromium, or Brave, click the Install icon in the address bar.",
        "LokSaathi will be integrated into your application launcher (GNOME / KDE).",
      ],
    },
    permSteps: {
      hi: [
        "ब्राउज़र में एड्रेस बार के लॉक आइकन पर क्लिक करके माइक और कैमरा को अनुमति दें।",
      ],
      en: [
        "Click the lock icon in the address bar and allow Microphone and Camera permissions.",
      ],
    },
    ttsSteps: {
      hi: [
        "Chrome/Chromium आधारित ब्राउज़र अपने आप Google TTS इंजन का उपयोग करते हैं।",
      ],
      en: [
        "Chromium-based browsers use the built-in online speech synthesis engine.",
      ],
    },
  },
};
