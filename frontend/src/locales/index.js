import { farmerStrings } from "./farmer.js";
import { cloudStrings } from "./cloud.js";
import { goalStrings } from "./goals.js";
import { biomassStrings } from "./biomass.js";
import { chartStrings } from "./charts.js";
import { regionalStrings } from "./regional.js";
const strings = {
  tagline: [
    "Know your feed. Care for your herd.",
    "தீவனத்தை அறிந்து மந்தையைப் பராமரியுங்கள்.",
    "चारा समझें। पशुओं का खयाल रखें।",
  ],
  home: ["Overview", "கண்ணோட்டம்", "अवलोकन"],
  newTest: ["New feed test", "புதிய தீவன சோதனை", "नया चारा परीक्षण"],
  history: ["My feed batches", "எனது தீவன தொகுதிகள்", "मेरे चारा बैच"],
  settings: ["Settings", "அமைப்புகள்", "सेटिंग्स"],
  online: [
    "Online · saved on this device first",
    "இணையம் உள்ளது · முதலில் சாதனத்தில் சேமிக்கப்படும்",
    "ऑनलाइन · पहले इस डिवाइस पर सहेजा जाता है",
  ],
  offline: [
    "Offline · tests stay on this device",
    "இணையமில்லை · சோதனைகள் இந்த சாதனத்தில் சேமிக்கப்படும்",
    "ऑफलाइन · परीक्षण इस डिवाइस पर रहेंगे",
  ],
  intro: [
    "A clearer picture of your feed",
    "உங்கள் தீவனத்தைப் பற்றிய தெளிவான பார்வை",
    "अपने चारे की बेहतर समझ",
  ],
  introText: [
    "Check storage conditions, record observations, and follow each batch over time. Works without internet after the first complete load.",
    "சேமிப்பு நிலையைச் சோதித்து, கவனிப்புகளைப் பதிவு செய்து, ஒவ்வொரு தொகுதியையும் கண்காணிக்கவும். முதல் முழுமையான பதிவிறக்கத்திற்குப் பிறகு இணையமின்றி இயங்கும்.",
    "भंडारण की जाँच करें, अवलोकन दर्ज करें और हर बैच का इतिहास देखें। पहली बार पूरा लोड होने के बाद बिना इंटरनेट चलता है।",
  ],
  total: ["Saved tests", "சேமித்த சோதனைகள்", "सहेजे गए परीक्षण"],
  batches: ["Batches", "தொகுதிகள்", "बैच"],
  alerts: ["High-risk tests", "அதிக அபாய சோதனைகள்", "उच्च जोखिम परीक्षण"],
  avg: [
    "Average screening score",
    "சராசரி மதிப்பீட்டு மதிப்பெண்",
    "औसत स्क्रीनिंग स्कोर",
  ],
  localOnly: [
    "Your records stay on this browser. Export a backup before clearing browser data.",
    "உங்கள் பதிவுகள் இந்த உலாவியில் உள்ளன. உலாவித் தரவை அழிக்கும் முன் காப்புப் பிரதியை ஏற்றுமதி செய்யவும்.",
    "रिकॉर्ड इसी ब्राउज़र में रहते हैं। ब्राउज़र डेटा मिटाने से पहले बैकअप निर्यात करें।",
  ],
  feedType: ["Feed type", "தீவன வகை", "चारे का प्रकार"],
  maize_silage: ["Maize silage", "மக்காச்சோள ஊறுகாய்த் தீவனம்", "मक्का साइलेज"],
  dry_feed: [
    "Dry feed (screening only)",
    "உலர் தீவனம் (முதற்கட்ட மதிப்பீடு மட்டும்)",
    "सूखा चारा (केवल स्क्रीनिंग)",
  ],
  batchName: ["Batch name", "தொகுதியின் பெயர்", "बैच का नाम"],
  existingBatch: [
    "Add test to batch",
    "தொகுதியில் சோதனை சேர்க்கவும்",
    "बैच में परीक्षण जोड़ें",
  ],
  newBatch: [
    "Create new batch",
    "புதிய தொகுதியை உருவாக்கவும்",
    "नया बैच बनाएँ",
  ],
  image: [
    "Feed photo (optional)",
    "தீவனப் படம் (விருப்பம்)",
    "चारे की तस्वीर (वैकल्पिक)",
  ],
  imageHelp: [
    "JPG, PNG or WebP, up to 10 MB. Photos are stored locally. Image diagnosis is unavailable.",
    "JPG, PNG அல்லது WebP, அதிகபட்சம் 10 MB. படங்கள் சாதனத்தில் சேமிக்கப்படும். பட நோயறிதல் கிடைக்கவில்லை.",
    "JPG, PNG या WebP, अधिकतम 10 MB। तस्वीरें स्थानीय रूप से सहेजी जाती हैं। तस्वीर से निदान उपलब्ध नहीं है।",
  ],
  invalidImage: [
    "Choose a valid JPG, PNG or WebP under 10 MB.",
    "10 MB-க்கு குறைவான சரியான படத்தைத் தேர்ந்தெடுக்கவும்.",
    "10 MB से छोटी वैध JPG, PNG या WebP चुनें।",
  ],
  lighting: [
    "Lighting is too dark or bright. Retake for a clearer record.",
    "ஒளி மிகக் குறைவு அல்லது அதிகம். மீண்டும் படம் எடுக்கவும்.",
    "रोशनी बहुत कम या अधिक है। साफ तस्वीर दोबारा लें।",
  ],
  blur: [
    "Low image detail; the photo may be blurry.",
    "பட விவரம் குறைவாக உள்ளது; படம் மங்கலாக இருக்கலாம்.",
    "तस्वीर में विवरण कम है; तस्वीर धुंधली हो सकती है।",
  ],
  remove: ["Remove photo", "படத்தை நீக்கவும்", "तस्वीर हटाएँ"],
  source: ["Reading source", "அளவீட்டு மூலம்", "रीडिंग का स्रोत"],
  manual: ["Manual measurements", "கைமுறை அளவீடுகள்", "हाथ से दर्ज माप"],
  virtual: [
    "Virtual Sensor Simulation",
    "மெய்நிகர் சென்சார் உருவகப்படுத்துதல்",
    "वर्चुअल सेंसर सिमुलेशन",
  ],
  simulationNote: [
    "Simulation values are examples, not physical sensor readings.",
    "உருவகப்படுத்திய மதிப்புகள் உதாரணங்கள்; உண்மையான சென்சார் அளவீடுகள் அல்ல.",
    "सिमुलेशन मान उदाहरण हैं, भौतिक सेंसर की रीडिंग नहीं।",
  ],
  temperature: ["Temperature (°C)", "வெப்பநிலை (°C)", "तापमान (°C)"],
  humidity: ["Humidity (%)", "ஈரப்பதம் (%)", "वायु आर्द्रता (%)"],
  moisture: [
    "Feed moisture (% wet basis)",
    "தீவன ஈரம் (% ஈர எடை)",
    "चारे की नमी (% गीले आधार पर)",
  ],
  ph: ["pH", "pH", "pH"],
  storageAge: ["Storage age (days)", "சேமித்த நாட்கள்", "भंडारण अवधि (दिन)"],
  observations: ["Your observations", "உங்கள் கவனிப்புகள்", "आपके अवलोकन"],
  mould: [
    "I can see possible mould",
    "பூஞ்சை போன்றவை தெரிகின்றன",
    "मुझे संभावित फफूँद दिख रही है",
  ],
  smell: [
    "Unusual or rotten smell",
    "வழக்கமற்ற அல்லது அழுகிய மணம்",
    "असामान्य या सड़ी गंध",
  ],
  analyze: ["Analyze feed", "தீவனத்தை மதிப்பிடவும்", "चारे का विश्लेषण करें"],
  invalidInput: [
    "Enter every reading within the displayed range.",
    "அனைத்து மதிப்புகளையும் காட்டப்பட்ட வரம்பிற்குள் உள்ளிடவும்.",
    "हर रीडिंग दिखाई गई सीमा में दर्ज करें।",
  ],
  result: ["Feed assessment", "தீவன மதிப்பீடு", "चारे का आकलन"],
  score: [
    "Feed Health Score",
    "தீவன ஆரோக்கிய மதிப்பெண்",
    "चारा स्वास्थ्य स्कोर",
  ],
  screening: [
    "Rule-based screening · not a safety certificate",
    "விதி அடிப்படையிலான மதிப்பீடு · பாதுகாப்புச் சான்றிதழ் அல்ல",
    "नियम आधारित स्क्रीनिंग · सुरक्षा प्रमाणपत्र नहीं",
  ],
  low: ["Low indicated risk", "குறைந்த அபாய அறிகுறி", "कम संकेतित जोखिम"],
  moderate: [
    "Moderate indicated risk",
    "மிதமான அபாய அறிகுறி",
    "मध्यम संकेतित जोखिम",
  ],
  high: ["High indicated risk", "அதிக அபாய அறிகுறி", "उच्च संकेतित जोखिम"],
  why: ["Why this score?", "இந்த மதிப்பெண் ஏன்?", "यह स्कोर क्यों?"],
  noFlags: [
    "No configured screening flags were triggered. Unknown hazards may still be present.",
    "குறிப்பிட்ட எச்சரிக்கைகள் இல்லை. அறியப்படாத அபாயங்கள் இருக்கலாம்.",
    "निर्धारित स्क्रीनिंग संकेत नहीं मिले। अज्ञात खतरे फिर भी हो सकते हैं।",
  ],
  highMoisture: ["High feed moisture", "அதிக தீவன ஈரம்", "चारे में अधिक नमी"],
  highHumidity: [
    "High storage humidity",
    "சேமிப்பில் அதிக ஈரப்பதம்",
    "भंडारण में अधिक आर्द्रता",
  ],
  highTemperature: ["High temperature", "அதிக வெப்பநிலை", "अधिक तापमान"],
  phIssue: [
    "Silage pH outside the screening range",
    "தீவன pH மதிப்பீட்டு வரம்பிற்கு வெளியே உள்ளது",
    "साइलेज pH स्क्रीनिंग सीमा से बाहर है",
  ],
  mouldReported: [
    "Possible mould reported by you",
    "நீங்கள் பூஞ்சை இருக்கலாம் எனக் குறிப்பிட்டீர்கள்",
    "आपने संभावित फफूँद दर्ज की",
  ],
  smellReported: [
    "Unusual smell reported by you",
    "நீங்கள் வழக்கமற்ற மணத்தைக் குறிப்பிட்டீர்கள்",
    "आपने असामान्य गंध दर्ज की",
  ],
  advice: [
    "Recommended next steps",
    "பரிந்துரைக்கப்படும் அடுத்த செயல்கள்",
    "सुझाए गए अगले कदम",
  ],
  isolate: [
    "Isolate the affected batch and seek qualified advice before feeding.",
    "பாதிக்கப்பட்ட தொகுதியைத் தனிமைப்படுத்தி தீவனமாக வழங்கும் முன் நிபுணரை அணுகவும்.",
    "प्रभावित बैच अलग रखें और खिलाने से पहले विशेषज्ञ की सलाह लें।",
  ],
  noMix: [
    "Do not mix affected feed with fresh feed.",
    "பாதிக்கப்பட்ட தீவனத்தைப் புதிய தீவனத்துடன் கலக்க வேண்டாம்.",
    "प्रभावित चारा ताज़े चारे में न मिलाएँ।",
  ],
  confirm: [
    "Suspected toxins require confirmatory laboratory testing.",
    "நச்சு சந்தேகம் இருந்தால் ஆய்வக உறுதிப்படுத்தல் தேவை.",
    "विष की आशंका में प्रयोगशाला की पुष्टि आवश्यक है।",
  ],
  inspect: [
    "Inspect this batch and nearby stored feed.",
    "இந்தத் தொகுதியையும் அருகிலுள்ள தீவனத்தையும் சோதிக்கவும்.",
    "इस बैच और आसपास रखे चारे की जाँच करें।",
  ],
  storageAdvice: [
    "Review storage. Keep dry feed dry; protect sealed silage from air entry.",
    "சேமிப்பைச் சரிபார்க்கவும். உலர் தீவனத்தை உலர வைத்தும் மூடிய ஊறுகாய்த் தீவனத்திற்குள் காற்று புகாமல் பாதுகாக்கவும்.",
    "भंडारण जाँचें। सूखा चारा सूखा रखें; बंद साइलेज में हवा न जाने दें।",
  ],
  retest: [
    "Re-test after checking storage conditions.",
    "சேமிப்பு நிலையைச் சரிபார்த்த பிறகு மீண்டும் சோதிக்கவும்.",
    "भंडारण जाँचने के बाद फिर परीक्षण करें।",
  ],
  monitor: [
    "Continue regular inspection and record changes.",
    "வழக்கமான ஆய்வைத் தொடர்ந்து மாற்றங்களைப் பதிவு செய்யவும்.",
    "नियमित निरीक्षण जारी रखें और बदलाव दर्ज करें।",
  ],
  notCertificate: [
    "This score cannot confirm nutritional adequacy or absence of toxins.",
    "இந்த மதிப்பெண் ஊட்டச்சத்து போதுமானது அல்லது நச்சுகள் இல்லை என்பதை உறுதிப்படுத்தாது.",
    "यह स्कोर पोषण की पर्याप्तता या विष की अनुपस्थिति की पुष्टि नहीं करता।",
  ],
  visual: ["Visual analysis", "காட்சி மதிப்பீடு", "दृश्य विश्लेषण"],
  unavailable: [
    "Unavailable — no trained image model. Photos cannot measure protein, pH or toxins.",
    "கிடைக்கவில்லை — பயிற்சி பெற்ற பட மாதிரி இல்லை. படங்கள் புரதம், pH அல்லது நச்சுகளை அளக்க முடியாது.",
    "अनुपलब्ध — प्रशिक्षित छवि मॉडल नहीं है। तस्वीर से प्रोटीन, pH या विष नहीं मापे जा सकते।",
  ],
  noImage: [
    "No photo supplied. Assessment uses entered readings and observations.",
    "படம் வழங்கப்படவில்லை. உள்ளீடுகள் மற்றும் கவனிப்புகளின் அடிப்படையில் மதிப்பிடப்பட்டது.",
    "तस्वीर नहीं दी गई। आकलन दर्ज रीडिंग और अवलोकन पर आधारित है।",
  ],
  nutrition: [
    "Nutrition / chemical safety",
    "ஊட்டச்சத்து / வேதியியல் பாதுகாப்பு",
    "पोषण / रासायनिक सुरक्षा",
  ],
  nutritionNote: [
    "Not predicted. Use measured laboratory values. No spectral data or NIR hardware is connected.",
    "கணிக்கப்படவில்லை. ஆய்வக அளவுகளைப் பயன்படுத்தவும். NIR சாதனம் அல்லது நிறமாலைத் தரவு இணைக்கப்படவில்லை.",
    "अनुमान नहीं किया गया। प्रयोगशाला के माप उपयोग करें। कोई स्पेक्ट्रल डेटा या NIR हार्डवेयर जुड़ा नहीं है।",
  ],
  save: [
    "Save batch test",
    "தொகுதி சோதனையைச் சேமிக்கவும்",
    "बैच परीक्षण सहेजें",
  ],
  saved: [
    "Saved on this device",
    "இந்த சாதனத்தில் சேமிக்கப்பட்டது",
    "इस डिवाइस पर सहेजा गया",
  ],
  saveError: [
    "Could not save. Check browser storage permissions and export existing records.",
    "சேமிக்க முடியவில்லை. உலாவிச் சேமிப்பு அனுமதியைச் சரிபார்க்கவும்.",
    "सहेज नहीं सके। ब्राउज़र स्टोरेज अनुमति जाँचें और पुराने रिकॉर्ड निर्यात करें।",
  ],
  empty: [
    "No batches yet. Start your first feed test.",
    "இன்னும் தொகுதிகள் இல்லை. முதல் சோதனையைத் தொடங்கவும்.",
    "अभी कोई बैच नहीं। पहला चारा परीक्षण शुरू करें।",
  ],
  twin: ["Feed Digital Twin", "தீவன டிஜிட்டல் பதிவு", "चारा डिजिटल ट्विन"],
  trend: ["Score history", "மதிப்பெண் வரலாறு", "स्कोर इतिहास"],
  decline: [
    "Score is declining. Inspect and re-test soon.",
    "மதிப்பெண் குறைகிறது. விரைவில் சோதிக்கவும்.",
    "स्कोर घट रहा है। जाँचें और जल्द फिर परीक्षण करें।",
  ],
  passport: ["QR Feed Passport", "QR தீவனப் பதிவு", "QR चारा पासपोर्ट"],
  qrNote: [
    "Offline summary only. Not a certification or public link.",
    "இணையமற்ற சுருக்கம் மட்டும். சான்றிதழோ பொது இணைப்போ அல்ல.",
    "केवल ऑफलाइन सारांश। प्रमाणपत्र या सार्वजनिक लिंक नहीं।",
  ],
  pending: ["Pending sync", "ஒத்திசைவு நிலுவையில்", "सिंक लंबित"],
  synced: ["Synced", "ஒத்திசைக்கப்பட்டது", "सिंक हुआ"],
  failed: [
    "Sync failed — retry available",
    "ஒத்திசைவு தோல்வி — மீண்டும் முயலலாம்",
    "सिंक विफल — फिर प्रयास करें",
  ],
  profile: [
    "Local profile name",
    "உள்ளூர் சுயவிவரப் பெயர்",
    "स्थानीय प्रोफ़ाइल नाम",
  ],
  export: [
    "Export local backup",
    "உள்ளூர் காப்புப்பிரதியை ஏற்றுமதி செய்",
    "स्थानीय बैकअप निर्यात करें",
  ],
  cloud: [
    "Optional cloud sync",
    "விருப்ப மேக ஒத்திசைவு",
    "वैकल्पिक क्लाउड सिंक",
  ],
  cloudNote: [
    "Core tests need no login. Cloud sync requires a configured Supabase project and an existing account.",
    "சோதனைகளுக்கு உள்நுழைவு தேவையில்லை. மேக ஒத்திசைவிற்கு Supabase அமைப்பும் கணக்கும் தேவை.",
    "मुख्य परीक्षण के लिए लॉगिन नहीं चाहिए। क्लाउड सिंक के लिए Supabase प्रोजेक्ट और मौजूदा खाता चाहिए।",
  ],
  notConfigured: [
    "Cloud sync is not configured. Your local tests remain available.",
    "மேக ஒத்திசைவு அமைக்கப்படவில்லை. உள்ளூர் சோதனைகள் கிடைக்கும்.",
    "क्लाउड सिंक कॉन्फ़िगर नहीं है। स्थानीय परीक्षण उपलब्ध रहेंगे।",
  ],
  email: ["Email", "மின்னஞ்சல்", "ईमेल"],
  password: ["Password", "கடவுச்சொல்", "पासवर्ड"],
  signIn: ["Sign in", "உள்நுழையவும்", "साइन इन"],
  signOut: ["Sign out", "வெளியேறு", "साइन आउट"],
  sync: [
    "Sync my records now",
    "எனது பதிவுகளை இப்போது ஒத்திசை",
    "मेरे रिकॉर्ड अभी सिंक करें",
  ],
  autoSync: [
    "Sync on reconnect (includes unclaimed local tests in this account)",
    "மீண்டும் இணையும் போது ஒத்திசை (உள்ளூர் சோதனைகள் இந்தக் கணக்கில் சேரும்)",
    "दोबारा कनेक्ट होने पर सिंक करें (स्थानीय परीक्षण इस खाते में जुड़ेंगे)",
  ],
  syncError: [
    "Cloud unavailable or sign-in failed. Local records are safe; retry later.",
    "மேகம் கிடைக்கவில்லை அல்லது உள்நுழைவு தோல்வி. பதிவுகள் பாதுகாப்பாக உள்ளன; பிறகு முயலவும்.",
    "क्लाउड अनुपलब्ध या साइन इन विफल। स्थानीय रिकॉर्ड सुरक्षित हैं; बाद में प्रयास करें।",
  ],
  syncDone: [
    "Synchronization completed",
    "ஒத்திசைவு முடிந்தது",
    "सिंक पूरा हुआ",
  ],
  lab: [
    "Optional laboratory FQI estimate",
    "விருப்ப ஆய்வக FQI மதிப்பீடு",
    "वैकल्पिक प्रयोगशाला FQI अनुमान",
  ],
  labNote: [
    "Maize silage only. Enter all 10 measured values in dataset units. FQI is a fermentation index, not the Feed Health Score or toxin clearance.",
    "மக்காச்சோள தீவனம் மட்டும். தரவுத்தொகுப்பு அலகுகளில் 10 அளவுகளையும் உள்ளிடவும். FQI என்பது நொதித்தல் குறியீடு; பாதுகாப்புச் சான்று அல்ல.",
    "केवल मक्का साइलेज। डेटासेट की इकाइयों में सभी 10 माप भरें। FQI किण्वन सूचकांक है, चारा स्वास्थ्य स्कोर या विषमुक्ति प्रमाण नहीं।",
  ],
  estimate: [
    "Estimate FQI locally",
    "FQI-ஐ சாதனத்தில் கணிக்கவும்",
    "स्थानीय FQI अनुमान",
  ],
  missingLab: [
    "Enter all laboratory measurements.",
    "அனைத்து ஆய்வக அளவுகளையும் உள்ளிடவும்.",
    "सभी प्रयोगशाला माप दर्ज करें।",
  ],
  outsideDomain: [
    "A value is outside the dataset range. Prediction withheld.",
    "மதிப்பு தரவுத்தொகுப்பு வரம்பிற்கு வெளியே உள்ளது. கணிப்பு நிறுத்தப்பட்டது.",
    "एक मान डेटासेट सीमा से बाहर है। अनुमान रोका गया।",
  ],
  modelUnavailable: [
    "Local FQI model unavailable. Screening still works.",
    "உள்ளூர் FQI மாதிரி கிடைக்கவில்லை. மதிப்பீடு இயங்கும்.",
    "स्थानीय FQI मॉडल अनुपलब्ध। स्क्रीनिंग चलती है।",
  ],
  storage: ["Storage screening", "சேமிப்பு மதிப்பீடு", "भंडारण स्क्रीनिंग"],
  freshness: ["Freshness screening", "புதுமை மதிப்பீடு", "ताज़गी स्क्रीनिंग"],
  busy: ["Working…", "செயல்படுகிறது…", "प्रक्रिया जारी…"],
  back: ["Back", "பின்செல்", "वापस"],
  install: ["Install app", "செயலியை நிறுவவும்", "ऐप इंस्टॉल करें"],
  installHelp: [
    "Install from your browser menu after the app has loaded.",
    "செயலி பதிவிறங்கிய பின் உலாவி மெனுவில் நிறுவவும்.",
    "ऐप लोड होने के बाद ब्राउज़र मेनू से इंस्टॉल करें।",
  ],
  labResult: ["Predicted FQI", "கணிக்கப்பட்ட FQI", "अनुमानित FQI"],
  measurement: [
    "Entered / reported",
    "உள்ளிட்ட / தெரிவித்த",
    "दर्ज / बताया गया",
  ],
  disclaimer: [
    "Predicted risk requires confirmation. No calibrated confidence or future spoilage time is available.",
    "கணிக்கப்பட்ட அபாயத்திற்கு உறுதிப்படுத்தல் தேவை. அளவீடு செய்யப்பட்ட நம்பகத்தன்மை அல்லது கெடும் நேரக் கணிப்பு இல்லை.",
    "अनुमानित जोखिम की पुष्टि आवश्यक है। प्रमाणित विश्वास स्तर या भविष्य में खराब होने का समय उपलब्ध नहीं है।",
  ],
};
Object.assign(strings, farmerStrings);
Object.assign(strings, cloudStrings);
Object.assign(strings, goalStrings);
Object.assign(strings, biomassStrings);
Object.assign(strings, chartStrings);
export const languages = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  mr: "मराठी",
  bn: "বাংলা",
  pa: "ਪੰਜਾਬੀ",
};
export function translate(lang, key) {
  return (
    regionalStrings[lang]?.[key] ||
    strings[key]?.[["en", "ta", "hi"].indexOf(lang)] ||
    strings[key]?.[0] ||
    key
  );
}
export { strings, regionalStrings };
