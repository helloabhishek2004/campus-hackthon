import { ComplaintCategory } from "@smart-campus/contracts";

interface RuleMatch {
  category: ComplaintCategory;
  subcategory: string;
  keywords: string[];
}

const CATEGORY_RULES: RuleMatch[] = [
  {
    category: "infrastructure",
    subcategory: "electrical_power",
    keywords: [
      "light",
      "fan",
      "switch",
      "switchboard",
      "spark",
      "electric",
      "power",
      "plug",
      "socket",
      "blackout",
      "air conditioner",
      "ac",
      "lift",
      "elevator",
    ],
  },
  {
    category: "it_services",
    subcategory: "wifi_network",
    keywords: [
      "wifi",
      "wi-fi",
      "internet",
      "network",
      "ethernet",
      "router",
      "lan",
      "portal",
      "lms",
    ],
  },
  {
    category: "sanitation",
    subcategory: "washroom_cleanliness",
    keywords: [
      "toilet",
      "washroom",
      "bathroom",
      "smell",
      "drainage",
      "garbage",
      "trash",
      "cleaning",
      "leakage",
    ],
  },
  {
    category: "hostel",
    subcategory: "room_maintenance",
    keywords: ["hostel", "dorm", "warden", "mess", "bed", "roommate"],
  },
  {
    category: "academic",
    subcategory: "curriculum_classes",
    keywords: [
      "exam",
      "professor",
      "class",
      "lecture",
      "marks",
      "attendance",
      "grade",
      "syllabus",
      "lab equipment",
    ],
  },
  {
    category: "security",
    subcategory: "campus_safety",
    keywords: [
      "theft",
      "stolen",
      "security",
      "guard",
      "gate",
      "threat",
      "harassment",
      "cctv",
    ],
  },
];

export function ruleBasedClassify(text: string): {
  category: ComplaintCategory;
  subcategory: string;
} {
  const lower = text.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }

  return { category: "other", subcategory: "general_inquiry" };
}
