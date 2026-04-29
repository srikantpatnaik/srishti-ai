// Multilingual intent detection keywords for 13 Indian languages + English
// Each entry: [native script keywords, romanized/transliterated keywords]

export const INTENT_KEYWORDS: Record<string, { image: string[]; audio: string[]; app: string[] }> = {
  hi: {
    // Hindi (Devanagari + romanized)
    image: [
      'तस्वीर', 'फोटो', 'छवि', 'चित्र', 'तस्वीर दिखाओ', 'फोटो दिखाओ', 'छवि बनाओ',
      'picture', 'photo', 'image', 'draw', 'banao', 'dikhao', 'dikhaao',
    ],
    audio: [
      'आवाज़', 'आवाज', 'ध्वनि', 'संगीत', 'गाओ', 'बोलो', 'सुनाओ', 'audio', 'music', 'song', 'voice', 'gana',
    ],
    app: [
      'ऐप', 'एप्लीकेशन', 'ऐप बनाओ', 'एप बनाओ', 'game', 'website', 'calculator', 'कैलकुलेटर', 'tool',
      'app', 'banao', 'build', 'create', 'make', 'todolist', 'todo', 'sudoku', 'clock',
    ],
  },
  bn: {
    // Bengali
    image: [
      'ছবি', 'ফোটো', 'ছবি দেখাও', 'ফোটো দেখাও', 'আঁকো', 'চিত্র',
      'photo', 'picture', 'image', 'draw', 'dikhao', 'dakho',
    ],
    audio: [
      'আওয়াজ', 'সংগীত', 'গান', 'ভয়েস', 'audio', 'music', 'song', 'gana',
    ],
    app: [
      'অ্যাপ', 'অ্যাপ্লিকেশন', 'গেম', 'game', 'website', 'calculator', 'ক্যালকুলেটর', 'tool',
      'app', 'banao', 'banau', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  te: {
    // Telugu
    image: [
      'చిత్రం', 'ఫోటో', 'ఫొటో', 'చిత్రం చూపించు', 'ఫోటో చూపించు', 'వర్ణించు',
      'photo', 'picture', 'image', 'draw', 'chupinchu', 'chusi',
    ],
    audio: [
      'ఆవాజ్', 'సంగీతం', 'పాట', 'వాయిస్', 'audio', 'music', 'song', 'voice', 'gaana',
    ],
    app: [
      'యాప్', 'యాప్లికేషన్', 'game', 'website', 'calculator', 'కాలిక్యులేటర్', 'tool',
      'app', 'cheyyu', 'cheyyu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  mr: {
    // Marathi
    image: [
      'छायाचित्र', 'फोटो', 'चित्र', 'छायाचित्र दाखव', 'फोटो दाखव', 'काढ',
      'photo', 'picture', 'image', 'draw', 'dakav', 'dakha',
    ],
    audio: [
      'आवाज', 'संगीत', 'गाणं', 'गान', 'voice', 'music', 'song', 'audio', 'gana',
    ],
    app: [
      'अॅप', 'अॅप्लिकेशन', 'game', 'website', 'calculator', 'कॅल्क्युलेटर', 'tool',
      'app', 'banav', 'banvaa', 'banava', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  ta: {
    // Tamil
    image: [
      'படம்', 'புகைப்படம்', 'காட்டு', 'வரை', 'image', 'photo', 'picture', 'draw', 'kattku', 'kattu',
    ],
    audio: [
      'குரல்', 'இசை', 'பாடல்', 'voice', 'music', 'song', 'audio', 'paadal', 'isa',
    ],
    app: [
      'ஆப்', 'ஆப்ளிஷன்', 'கேம்', 'game', 'website', 'calculator', 'கால்குலேட்டர்', 'tool',
      'app', 'sei', 'seiyala', 'seyy', 'todolist', 'todo', 'sudoku',
    ],
  },
  gu: {
    // Gujarati
    image: [
      'તસવીર', 'ફોટો', 'ચિત્ર', 'તસવીર બતાવો', 'ફોટો બતાવો', 'ગીચો',
      'photo', 'picture', 'image', 'draw', 'batavo', 'batau',
    ],
    audio: [
      'આવાજ', 'સંગીત', 'ગીત', 'વૉઇસ', 'audio', 'music', 'song', 'geet',
    ],
    app: [
      'એપ', 'એપ્લિકેશન', 'game', 'website', 'calculator', 'કેલ્ક્યુલેટર', 'tool',
      'app', 'banavo', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  kn: {
    // Kannada
    image: [
      'ಚಿತ್ರ', 'ಫೋಟೋ', 'ಚಿತ್ರ ತೋರು', 'ಫೋಟೋ ತೋರು', 'ವರ್ಣಿಸು',
      'photo', 'picture', 'image', 'draw', 'thoru', 'tharoo',
    ],
    audio: [
      'ಹಸ್ಸು', 'ಸಂಗೀತ', 'ಗೀತೆ', 'voice', 'music', 'song', 'audio', 'geete', 'sangeeta',
    ],
    app: [
      'ಆಪ್', 'ಆಪ್ಲಿಕೇಶನ್', 'ಗೇಮ್', 'game', 'website', 'calculator', 'ಕ್ಯಾಲ್ಕುಲೇಟರ್', 'tool',
      'app', 'banu', 'banuvu', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  ml: {
    // Malayalam
    image: [
      'ചിത്രം', 'ഫോട്ടോ', 'ചിത്രം കാണിക്കു', 'ഫോട്ടോ കാണിക്കു', 'വരയ്ക്കു',
      'photo', 'picture', 'image', 'draw', 'kanniku', 'kannithu',
    ],
    audio: [
      'ശബ്ദം', 'സംഗീതം', 'പാടുക', 'voice', 'music', 'song', 'audio', 'geetham', 'sangeetham',
    ],
    app: [
      'ആപ്പ്', 'ആപ്പ്ലിക്കേഷൻ', 'game', 'website', 'calculator', 'കാൽക്കുലേറ്റർ', 'tool',
      'app', 'banikkuka', 'banikku', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  pa: {
    // Punjabi (Gurmukhi + romanized)
    image: [
      'ਤਸਵੀਰ', 'ਫੋਟੋ', 'ਚਿੱਤਰ', 'ਤਸਵੀਰ ਦਿਖਾਓ', 'ਫੋਟੋ ਦਿਖਾਓ', 'ਬਣਾਓ',
      'photo', 'picture', 'image', 'draw', 'dikhao', 'banao',
    ],
    audio: [
      'ਅਵਾਜ਼', 'ਸੰਗੀਤ', 'ਗੀਤ', 'voice', 'music', 'song', 'audio', 'geet', 'sangeet',
    ],
    app: [
      'ਐਪ', 'ਐਪਲੀਕੇਸ਼ਨ', 'game', 'website', 'calculator', 'ਕੈਲਕੁਲੇਟਰ', 'tool',
      'app', 'banao', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  ur: {
    // Urdu (Persian script + romanized)
    image: [
      'تصویر', 'فوٹو', 'چِتر', 'تصویر دکھاؤ', 'فوٹو دکھاؤ', 'بنائو',
      'photo', 'picture', 'image', 'draw', 'dikhao', 'banao',
    ],
    audio: [
      'آواز', 'موسیقی', 'گانا', 'voice', 'music', 'song', 'audio', 'geet', 'sangeet',
    ],
    app: [
      'ایپ', 'ایپلیکیشن', 'game', 'website', 'calculator', 'کیلکولیٹر', 'tool',
      'app', 'banao', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  or: {
    // Odia
    image: [
      'ଛବି', 'ଫଟୋ', 'ଛବି ଦେଖାଅ', 'ଫଟୋ ଦେଖାଅ', 'ଆଙ୍କ',
      'photo', 'picture', 'image', 'draw', 'dekhaa', 'dekha',
    ],
    audio: [
      'ଆଵାଜ', 'ସଙ୍ଗୀତ', 'ଗୀତ', 'voice', 'music', 'song', 'audio', 'geeta', 'sangeeta',
    ],
    app: [
      'ଆପ୍', 'ଆପ୍ଲିକେସନ୍', 'game', 'website', 'calculator', 'କ୍ୟାଲକୁଲେଟର', 'tool',
      'app', 'banahu', 'banau', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  as: {
    // Assamese
    image: [
      'ছবি', 'ফটো', 'ছবি দেখুও', 'ফটো দেখুও', 'আঁকি',
      'photo', 'picture', 'image', 'draw', 'dikhau', 'dikhao',
    ],
    audio: [
      'স্বৰ', 'সংগীত', 'গান', 'voice', 'music', 'song', 'audio', 'geet', 'sangeet',
    ],
    app: [
      'এপ', 'এপ্লিকেচন', 'game', 'website', 'calculator', 'কেল্কুলেটৰ', 'tool',
      'app', 'banau', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
  mai: {
    // Maithili (Devanagari + romanized)
    image: [
      'तस्वीर', 'फोटो', 'छवि', 'चित्र', 'तस्वीर दिखाउ', 'फोटो दिखाउ', 'बनाउ',
      'photo', 'picture', 'image', 'draw', 'banao', 'dikhao',
    ],
    audio: [
      'आवाज', 'ध्वनि', 'संगीत', 'गाउ', 'voice', 'music', 'song', 'audio', 'geet', 'sangeet',
    ],
    app: [
      'एप', 'एप्लीकेशन', 'game', 'website', 'calculator', 'कैलकुलेटर', 'tool',
      'app', 'banao', 'banau', 'banavu', 'build', 'create', 'make', 'todolist', 'todo',
    ],
  },
}

// Default English keywords (used when no language or unknown language)
// Also includes Devanagari script keywords (hi/mr/mai/ur) since they're widely understood
export const DEFAULT_KEYWORDS = {
  image: [
    'show me', 'picture', 'photo', 'image', 'draw', 'cartoon', 'illustration',
    'cartoon', 'illustration', 'sketch', 'painting', 'rendering', 'visual',
    'design', 'logo', 'icon', 'artwork', 'art', 'portrait', 'screenshot',
    'mockup', 'diagram', 'infographic', 'poster', 'artificial intelligence art',
    // Devanagari script (Hindi/Marathi/Maithili)
    'तस्वीर', 'फोटो', 'छवि', 'चित्र', 'तस्वीर दिखाओ', 'फोटो दिखाओ',
    // Persian/Urdu script
    'تصویر', 'فوٹو',
  ],
  audio: [
    'audio', 'music', 'song', 'voice', 'sound', 'speech', 'tts',
    'synthesize', 'podcast', 'jingle', 'beep', 'tone', 'melody',
    'text to speech', 'read aloud', 'speak', 'pronounce',
    // Devanagari
    'संगीत', 'आवाज', 'आवाज़', 'ध्वनि', 'गाओ', 'सुनाओ',
    // Persian/Urdu
    'آواز', 'موسیقی',
  ],
  app: [
    'build', 'app', 'application', 'game', 'website', 'code', 'program',
    'tool', 'software', 'develop', 'calculator',
    'todo', 'todo list', 'sudoku', 'puzzle', 'clock', 'timer',
    'calculator app', 'calc', 'webpage', 'page', 'form', 'dashboard',
    'tracker', 'converter', 'player', 'viewer', 'editor',
    // Devanagari
    'ऐप', 'एप्लीकेशन', 'कैलकुलेटर', 'कैलकुलेटर ऐप',
    // Persian/Urdu
    'ایپ', 'ایپلیکیشن',
  ],
}
