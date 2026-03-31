export interface Disease {
  name: string;
  months: string[];
  symptoms: string[];
  where: string;
  why: string;
  when: {
    high: string;
    moderate: string;
    low: string;
  };
  organic: string[];
  chemical: string[];
  conditions?: Array<{
    temperatureRange: string;
    humidityRange: string;
  }>;
  image: string;
  stage?: {
    minDays: number;
    maxDays: number;
    description: string;
  };
}

export const diseasesData: Disease[] = [
  {
    name: "Red Rot",
    months: ["July", "August", "September", "October", "November"],
    stage: {
      minDays: 121,
      maxDays: 365,
      description: "Grand Growth (121-210 days) to Maturity (211-365 days)"
    },
    symptoms: [
      "Leaf changes colour from green to yellow, then drying from bottom to top.",
      "Red spots on the back side of the midrib if spores enter through the leaf.",
      "Visible symptoms 16-21 days after infection; cane dries up in 10 days.",
      "Inside cane: reddish with white streaks, sometimes blackish-brown liquid with alcohol smell."
    ],
    where: "Stems and leaves",
    why: "Due to fungal infection in humid conditions",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: ["Trichoderma -5kg/acre with 100 kg farm yard manure"],
    chemical: ["Carbendazim-500–1000gm/acre in 200–400 litre water, through drip irrigation"],
    conditions: [
      {
        temperatureRange: "25.00°C–30.00°C",
        humidityRange: "80%–90%"
      },
      {
        temperatureRange: "28.00°C–34.00°C",
        humidityRange: "50%–65%"
      }
    ],
    image: "/Image/red_rot.jpg"
  },
  {
    name: "Smut",
    months: ["February", "March", "April", "May", "June"],
    stage: {
      minDays: 0,
      maxDays: 120,
      description: "Germination (0-45 days) to Tillering (46-120 days)"
    },
    symptoms: [
      " A long whip-like structure (25–150 cm) grows from the top of the cane.",
      "This whip is covered with a silvery layer and filled with black powdery spores.",
      "At first, the cane grows tall with long internodes, but later the growth becomes shorter",
      "organic -Trichoderma 5kg /acre with 100 kg farm yard manure",
      "Chemical- Dip seed setts in Carbendazim 0.1% or Tradimefon 0.005% for 30 min before planting."
    ],
    where: "Top of the cane",
    why: "Due to fungal infection through wounds",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: ["Trichoderma - 5kg/acre with 100 kg farm yard manure"],
    chemical: [
      "Dip setts in Carbendazim 0.1% as -1gm/litre of water",
      "OR Tradimefon 0.005% as - 0.5gm/litre of water, for 30 min before planting"
    ],
    conditions: [
      {
        temperatureRange: "25.00°C–30.00°C",
        humidityRange: "75%–85%"
      }
    ],
    image: "/Image/smut.jpg"
  },
  {
    name: "Grassy Shoot",
    months: ["February", "March", "April", "May"],
    stage: {
      minDays: 90,
      maxDays: 120,
      description: "3-4 month old crops"
    },
    symptoms: [
      "In 3–4 month old crops, thin, white papery leaves appear at the top of the cane.",
      "Many white or yellow shoots grow from below these leaves ",
      "The cane becomes short with small gaps between nodes and side buds start growing.",
      "The disease usually shows up in a few isolated clumps.",
      "Organic- Dip setts in Trichoderma viride suspension or Pseudomonas fluorescens solution before planting",
      "Chemical- Dip setts in Tetracycline hydrochloride (250ppm) for 3 4 hrs",
      "Spray imidacloprid 17.8% at 0.5ml/litre"
    ],
    where: "Top of the cane and side buds",
    why: "Due to phytoplasma infection",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: ["Dip setts in Trichoderma viridae or Pseudomonas fluorescens before planting -10 gms/litre of water"],
    chemical: [
      "Dip setts in Tetracycline hydrochloride (250 ppm) for 3–4 hrs",
      "Spray Imidacloprid 17.8% at 0.5ml/litre"
    ],
    conditions: [
      {
        temperatureRange: "30.00°C–35.00°C",
        humidityRange: "65%–75%"
      }
    ],
    image: "/Image/grassy_shoot.png"
  },
  {
    name: "Wilt",
    months: ["July", "August", "September", "October"],
    stage: {
      minDays: 121,
      maxDays: 365,
      description: "Grand Growth (121-210 days) to Maturity (211-365 days)"
    },
    symptoms: [
      "Signs of the disease appear when the crop is 4–5 months old.",
      "Leaves slowly turn yellow and dry, and canes become weak and shrink.",
      "Inside the cane, the center turns purple or brown with holes in the middle.",
      "A bad smell and white cotton-like fungus are often seen inside."
    ],
    where: "Inside the cane stem",
    why: "Due to fungal infection in waterlogged conditions",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: ["Trichoderma 5kg/acre with 100kg farm yard manure"],
    chemical: [
      "Dip setts in Carbendazim 0.1% at 1gm/litre for 30 mins",
      "Apply Carbendazim 1kg/acre with compost manure"
    ],
    conditions: [
      {
        temperatureRange: "30.00°C–35.00°C",
        humidityRange: "65%–75%"
      }
    ],
    image: "/Image/wilt.png"
  },
  {
    name: "Ratoon Stunting Disease (RSD)",
    months: ["February", "March", "April", "May", "June", "July", "August", "September", "October", "November"],
    stage: {
      minDays: 0,
      maxDays: 365,
      description: "Any stage, especially ratoon crops"
    },
    symptoms: [
      "Affected plants are stunted, especially in stubble and ratoon crops.",
      "Small orange dot-like bacteria appear inside the soft tissue near the nodes.",
      "Setts from diseased plants germinate poorly.",
      "Shoots that emerge grow very slowly."
    ],
    where: "Entire plant, especially ratoon crops",
    why: "Due to bacterial infection",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: ["Treat setts in hot water at 50°C for 2 hours before planting."],
    chemical: [
      "Use ammonium sulfate (20-30 kg per acre) on soil and disinfect tools with Lysol or Dettol for 5 minutes."
    ],
    conditions: [
      {
        temperatureRange: "30.00°C–38.00°C",
        humidityRange: "60%–70%"
      }
    ],
    image: "/Image/ratoon stunting.jpg"
  },
  {
    name: "Leaf Scald",
    months: ["March", "April", "May", "June", "July", "August"],
    stage: {
      minDays: 90,
      maxDays: 300,
      description: "Tillering to maturity"
    },
    symptoms: [
      "White “pencil lines” (1–2 mm wide) run along leaf veins with yellow borders.",
      "Leaves turn pale, curl inward, and get brown necrotic patches (“scalded” look)",
      "Infected stalks may be stunted with many side shoots.",
      "Acute cases cause sudden death of whole stalks."
    ],
    where: "Leaves, especially tips and margins",
    why: "Due to bacterial infection in hot, humid conditions",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: [
      "Use hot water treatment of setts at 50°C for 2 hours before planting.",
      "Spray with neem oil (5 ml per liter water) to boost plant resistance."
    ],
    chemical: [
      "Copper oxychloride (77% WP): 25 grams per 10 liters of water, spray on leaves.",
      "Copper hydroxide: 2 grams per liter of water, spray thoroughly on crop.",
      "Disinfect tools with Lysol or Dettol for 5 minutes contact to prevent disease spread."
    ],
    conditions: [
      {
        temperatureRange: "30.00°C–35.00°C",
        humidityRange: "70%–80%"
      }
    ],
    image: "/Image/Leaf Scaleimg.jpg"
  },
  {
    name: "Rust",
    months: ["August", "September", "October", "November", "December"],
    stage: {
      minDays: 46,
      maxDays: 365,
      description: "Tillering (46-120 days) to Maturity (211-365 days)"
    },
    symptoms: [
      "Small yellow spots appear first on both leaf sides.",
      "Spots grow longer, turn brown or reddish-brown, and merge into big rusty patches.",
      "Leaves look rusty and may die early because of this damage."
    ],
    where: "Leaf surfaces, both upper and lower",
    why: "Due to fungal infection in cool, humid conditions",
    when: {
      high: "Present at the field",
      moderate: "In next 3–7 days",
      low: "In next 10–14 days"
    },
    organic: [
      "Remove and burn infected leaves to stop disease spread.",
      "Use natural fungicides like neem oil spray (5 ml per liter water) to reduce infection."
    ],
    chemical: [
      "Spray Tridemorph at 1.0 litre per hectare.",
      "Use Mancozeb at 2.0 kg per hectare.",
      "Spray Dithane M-45 at 2 g per liter of water (one time).",
      "Apply triazole, strobilurin, or pyraclostrobin fungicides at 3 g per liter of water."
    ],
    conditions: [
      {
        temperatureRange: "20.00°C–25.00°C",
        humidityRange: "85%–95%"
      }
    ],
    image: "/Image/rust.jpg"
  },
  {
    name: "Downy Mildew",
    stage: {
      minDays: 121,
      maxDays: 210,
      description: "Grand Growth (121-210 days)"
    },
    months: ["June", "July", "August"],
    symptoms: [
      "Small yellow spots on leaves that turn into pale yellow or white stripes.",
      "White fuzzy (downy) growth on both sides of leaves, especially at night with dew."
    ],
    where: "Both sides of maize leaves, especially under humid conditions",
    why: "Caused by fungal-like pathogens thriving in cool, moist conditions",
    when: {
      high: "Present at the field",
      moderate: "In next 3–5 days",
      low: "In next 7–10 days"
    },
    organic: [
      "Remove and burn infected plants immediately.",
      "Avoid planting maize close to sugarcane to prevent spread."
    ],
    chemical: [
      "Metalaxyl at 2 g per liter of water ,spray on affected plants.",
      "Mancozeb at 2–2.5 g per liter of water ,spray thoroughly on leaves."
    ],
    conditions: [
      {
        temperatureRange: "20.00°C–25.00°C",
        humidityRange: "85%–90%"
      }
    ],
    image: "/Image/downy mildew.JPG"
  }
];
