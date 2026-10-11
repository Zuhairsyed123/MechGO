/**
 * MechGO - Driver Safety & Customer Understanding Service
 * 
 * Provides roadside safety guidelines, category-specific follow-up questions,
 * and multi-language support (English, Hindi, Hinglish).
 */

export const SUPPORTED_LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hi', label: 'हिन्दी', short: 'HI' },
  { id: 'hinglish', label: 'Hinglish', short: 'HING' },
];

// Highway Safety Checklist for Drivers
export const DRIVER_SAFETY_CHECKLIST = [
  {
    id: 'hazard_lights',
    en: 'Hazard warning flashers are switched ON',
    hi: 'गाड़ी की हजार्ड वार्निंग लाइट ऑन है',
    hinglish: 'Car ke hazard flashers ON hain',
    critical: true,
  },
  {
    id: 'safe_shoulder',
    en: 'Vehicle is parked on highway shoulder / off active traffic lanes',
    hi: 'गाड़ी हाईवे शोल्डर या किनारे पर सुरक्षित खड़ी है',
    hinglish: 'Vehicle traffic lanes se hatt kar shoulder par khada hai',
    critical: true,
  },
  {
    id: 'passengers_safe',
    en: 'Passengers are standing safely behind crash barrier',
    hi: 'यात्री हाईवे रेलिंग या बैरियर के पीछे सुरक्षित खड़े हैं',
    hinglish: 'Sabhi passengers crash barrier ke peeche safe khade hain',
    critical: false,
  },
  {
    id: 'handbrake_gear',
    en: 'Handbrake is engaged and gear is locked',
    hi: 'हैंडब्रेक लगा हुआ है और गियर लगा है',
    hinglish: 'Handbrake pulled hai aur car gear/park mein hai',
    critical: false,
  },
];

// Dynamic follow-up questions based on breakdown category
export const CATEGORY_FOLLOW_UPS = {
  'Flat Tyre': [
    {
      id: 'spare_wheel',
      question: {
        en: 'Do you have an inflated spare wheel (Stepney)?',
        hi: 'क्या आपके पास हवा भरा हुआ स्पेयर टायर (स्टेपनी) है?',
        hinglish: 'Kya car mein inflated spare tyre (Stepney) available hai?'
      },
      options: ['Yes, ready in boot', 'Spare is flat/punctured', 'No spare wheel', 'Not sure']
    },
    {
      id: 'jack_tools',
      question: {
        en: 'Do you have the jack and wheel spanner?',
        hi: 'क्या आपके पास जैक और पाना उपलब्ध है?',
        hinglish: 'Kya aapke paas car jack aur spanner tools hain?'
      },
      options: ['Yes, have both', 'Only jack', 'Tools missing / need mechanic kit']
    }
  ],
  'Dead Battery': [
    {
      id: 'starter_symptom',
      question: {
        en: 'What happens when turning the ignition key?',
        hi: 'चाबी घुमाने पर क्या आवाज आती है?',
        hinglish: 'Ignition on karne par kya hota hai?'
      },
      options: ['Rapid clicking sound', 'Complete silence / no lights', 'Engine cranks very weakly']
    },
    {
      id: 'headlights_condition',
      question: {
        en: 'Are headlights or cabin lights glowing?',
        hi: 'क्या हेडलाइट्स या केबिन लाइट जल रही हैं?',
        hinglish: 'Headlights ya meter lights on ho rahi hain?'
      },
      options: ['Very dim lights', 'Completely off', 'Normal brightness']
    }
  ],
  'Engine Overheat': [
    {
      id: 'steam_smoke',
      question: {
        en: 'Is there steam or sweet-smelling vapor from bonnet?',
        hi: 'क्या बोनट से भाप या धुआं निकल रहा है?',
        hinglish: 'Bonnet se white steam ya smoke nikal raha hai?'
      },
      options: ['Yes, white steam visible', 'No smoke, but temp gauge high', 'Coolant puddling underneath']
    },
    {
      id: 'radiator_touched',
      question: {
        en: 'Did you attempt to open the radiator cap?',
        hi: 'क्या आपने रेडिएटर कैप खोलने की कोशिश की?',
        hinglish: 'Kya aapne radiator cap kholne ki koshish ki?'
      },
      options: ['No, left it alone (Recommended)', 'Opened it slightly', 'Not touched']
    }
  ],
  'Out of Fuel': [
    {
      id: 'fuel_variant',
      question: {
        en: 'Exact vehicle fuel requirement?',
        hi: 'गाड़ी में कौन सा ईंधन डलेगा?',
        hinglish: 'Vehicle ka exact fuel type kya hai?'
      },
      options: ['Petrol (E20 compatible)', 'Diesel', 'CNG', 'EV Charging support required']
    },
    {
      id: 'canister_available',
      question: {
        en: 'Do you need mechanic to bring an approved fuel canister?',
        hi: 'क्या मैकेनिक को 5L अप्रूव्ड केन लेकर आना होगा?',
        hinglish: 'Mechanic ko fuel jerry can lana padega?'
      },
      options: ['Yes, bring 5 Litres canister', 'Need towing to nearest fuel station']
    }
  ],
  'Towing Needed': [
    {
      id: 'drivetrain_state',
      question: {
        en: 'Can the vehicle wheels roll freely in neutral?',
        hi: 'क्या गाड़ी के पहिए न्यूट्रल में घूम पा रहे हैं?',
        hinglish: 'Kya car ke wheels neutral mein ghoom rahe hain?'
      },
      options: ['Yes, wheels roll freely', 'Wheels locked / transmission jammed', 'Severe wheel/axle impact']
    }
  ],
  'Keys Locked': [
    {
      id: 'key_location',
      question: {
        en: 'Where are the keys located inside?',
        hi: 'चाबी गाड़ी के अंदर कहां रखी है?',
        hinglish: 'Keys gaadi ke andar kahan hain?'
      },
      options: ['Visible on front seat', 'In ignition slot', 'Inside locked boot/trunk']
    }
  ],
  'Other Issue': [
    {
      id: 'mobility_status',
      question: {
        en: 'Is the vehicle completely immobile or can it limp?',
        hi: 'क्या गाड़ी बिल्कुल बंद है या धीरे-धीरे चल सकती है?',
        hinglish: 'Gaadi bilkul band hai ya slow speed mein chal sakti hai?'
      },
      options: ['Completely immobile / stalled', 'Can limp at <20 km/h', 'Brakes failed']
    }
  ]
};

// Upfront Estimated Price Matrix
export const UPFRONT_ESTIMATES = {
  'Flat Tyre': { callFee: 0, visitMin: 299, visitMax: 449, partsMin: 100, partsMax: 250, avgTime: '20-30 min' },
  'Dead Battery': { callFee: 0, visitMin: 299, visitMax: 399, partsMin: 0, partsMax: 300, avgTime: '15-25 min' },
  'Engine Overheat': { callFee: 49, visitMin: 399, visitMax: 599, partsMin: 200, partsMax: 700, avgTime: '30-45 min' },
  'Out of Fuel': { callFee: 0, visitMin: 349, visitMax: 499, partsMin: 450, partsMax: 600, avgTime: '20-35 min' },
  'Towing Needed': { callFee: 0, visitMin: 999, visitMax: 1800, partsMin: 0, partsMax: 0, avgTime: '35-50 min' },
  'Keys Locked': { callFee: 49, visitMin: 449, visitMax: 699, partsMin: 0, partsMax: 0, avgTime: '25-40 min' },
  'Brake Failure': { callFee: 49, visitMin: 449, visitMax: 799, partsMin: 300, partsMax: 900, avgTime: '35-55 min' },
  'Other Issue': { callFee: 0, visitMin: 349, visitMax: 549, partsMin: 150, partsMax: 600, avgTime: '25-45 min' }
};

export const MULTI_LANG_SAFETY_TIPS = {
  en: [
    'Turn on your hazard warning lights immediately.',
    'Remain on the passenger shoulder, never stand in active highway lanes.',
    'If engine is overheating, never open the radiator cap while hot.'
  ],
  hi: [
    'तुरंत गाड़ी की हजार्ड लाइट्स (चारों इंडिकेटर) ऑन करें।',
    'हमेशा हाईवे शोल्डर पर रहें, चालू लेन में कभी न खड़े हों।',
    'यदि इंजन गर्म है तो कभी भी रेडिएटर का ढक्कन न खोलें।'
  ],
  hinglish: [
    'Turant hazard warning flashers on kar dein.',
    'Highway shoulder par safely khade rahein, road par na jayein.',
    'Agar engine overheated hai, toh radiator cap bilkul na kholein.'
  ]
};
