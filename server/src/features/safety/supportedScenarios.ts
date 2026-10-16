import { FollowUpQuestion, SolutionStep } from "@fixit/shared";

export interface SupportedScenario {
  id: string;
  name: string;
  keywords: string[];
  defaultStainCategory: string;
  defaultSurface: string;
  requiredInfoKeys: string[];
  followUpQuestions: FollowUpQuestion[];
  materialsNeeded: string[];
  actionSteps: SolutionStep[];
  actionsToAvoid: string[];
  safetyPrecautions: string[];
  whenToStopAndSeekHelp: string[];
  whyTheseStepsExplanation: string;
  alternativeSteps?: SolutionStep[];
}

export const SUPPORTED_SCENARIOS: SupportedScenario[] = [
  {
    id: "coffee_tea_fabric",
    name: "Coffee or Tea Stain on Washable Fabric",
    keywords: ["coffee", "tea", "espresso", "latte", "cappuccino", "brew"],
    defaultStainCategory: "Tannin & Organic Beverage Stain",
    defaultSurface: "Washable Fabric / Garment",
    requiredInfoKeys: ["fabric_type", "stain_freshness"],
    followUpQuestions: [
      {
        id: "fabric_type",
        question: "What kind of fabric is the item made of?",
        reason:
          "Delicate materials like 100% silk or wool require specialized dry cleaning and can shrink or degrade with standard water-detergent treatments.",
        type: "single_choice",
        options: [
          "Washable Cotton / Poly Blend",
          "Delicate Silk or Wool",
          "Synthetic / Athletic Fabric",
          "I am not sure / Check Care Label",
        ],
        required: true,
      },
      {
        id: "stain_freshness",
        question: "Is the coffee stain fresh (still damp) or already dried / washed?",
        reason:
          "Fresh tannin stains respond readily to cold water flush, whereas set-in or dried stains need mild enzyme pre-treatment.",
        type: "single_choice",
        options: ["Fresh (spilled within the last hour)", "Dried / Set-in for several hours", "Already washed or ironed"],
        required: true,
      },
    ],
    materialsNeeded: [
      "Clean white microfiber or paper towels",
      "Cold running tap water",
      "Mild liquid laundry detergent or dish soap",
      "White distilled vinegar (optional, for lingering tannin marks)",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Blot immediately — Do not rub",
        instruction:
          "Press clean paper towels or a dry white cloth gently on the stain to absorb excess liquid. Never rub back and forth, as rubbing pushes coffee deeper into the fabric fibers.",
        cautionNotes: "Avoid colored napkins that might bleed dye onto the garment.",
      },
      {
        stepNumber: 2,
        title: "Flush from the reverse side with cold water",
        instruction:
          "Turn the garment inside out and run cold tap water through the back of the stain. Flushing backwards pushes the coffee particles out rather than through the cloth.",
        cautionNotes: "Use cold water only. Hot water can cook milk proteins and permanently set tannins.",
      },
      {
        stepNumber: 3,
        title: "Pre-treat with mild liquid detergent",
        instruction:
          "Apply a few drops of mild liquid detergent or gentle dish soap to the damp spot. Work it in gently with your fingertips and let sit for 5 to 10 minutes.",
        isCheckedTestPatch: true,
      },
      {
        stepNumber: 4,
        title: "Rinse thoroughly and inspect before drying",
        instruction:
          "Rinse well in cold water. Inspect the fabric in natural light. If the stain has vanished, launder normally according to the care label.",
        cautionNotes: "NEVER put the garment in a hot dryer until the stain is 100% gone; heat will bake any residue permanently.",
      },
    ],
    actionsToAvoid: [
      "DO NOT use hot water on fresh coffee (heat sets tannin and milk proteins)",
      "DO NOT rub violently with abrasive brushes or colored washcloths",
      "DO NOT place in a clothes dryer until the stain is completely removed",
      "DO NOT mix ammonia or bleach with vinegar",
    ],
    safetyPrecautions: [
      "Always check the inner care tag before applying water or spot treatments",
      "Test any detergent or vinegar solution on a hidden seam first",
    ],
    whenToStopAndSeekHelp: [
      "If the garment tag says 'Dry Clean Only', take it to a professional cleaner promptly and disclose the spill",
      "If the garment is pure silk, antique lace, or fine wool",
    ],
    whyTheseStepsExplanation:
      "Coffee contains acidic tannins and often dairy proteins. Cold reverse flushing dislodges pigments before they bind to fiber cellulose, while mild surfactant dissolves any oily oils or dairy without scorching the weave.",
    alternativeSteps: [
      {
        stepNumber: 1,
        title: "Dilute white vinegar soak (for persistent tannin rings)",
        instruction:
          "Mix 1 tablespoon of white distilled vinegar with 2 cups of cool water. Submerge the stained area for 15 minutes, then rinse with cold water.",
        cautionNotes: "Do not use vinegar on acetate or rayon fabrics.",
      },
      {
        stepNumber: 2,
        title: "Oxygen-based bleach soak (safe for colored washables)",
        instruction:
          "Dissolve 1 scoop of oxygen bleach powder (sodium percarbonate) in a basin of warm water. Soak the garment for 1 to 2 hours, then wash normally.",
        cautionNotes: "Do not use chlorine bleach on colored fabrics.",
      },
    ],
  },
  {
    id: "mud_washable_shoes",
    name: "Mud and Soil on Washable Shoes & Sneakers",
    keywords: ["mud", "dirt", "sneakers", "shoes", "boots", "clay"],
    defaultStainCategory: "Particulate Soil & Mineral Mud",
    defaultSurface: "Washable Footwear (Canvas / Mesh / Rubber)",
    requiredInfoKeys: ["shoe_material", "mud_dryness"],
    followUpQuestions: [
      {
        id: "shoe_material",
        question: "What material are your shoes made of?",
        reason: "Canvas and synthetic mesh tolerate water and gentle soap, while real suede or nubuck will be ruined by water immersion.",
        type: "single_choice",
        options: [
          "Canvas or Synthetic Mesh (e.g. running shoes)",
          "Genuine Leather or Suede",
          "Rubber / Foam Slip-ons",
          "Mixed Materials",
        ],
        required: true,
      },
      {
        id: "mud_dryness",
        question: "Is the mud currently wet or completely dried?",
        reason: "Rubbing wet mud smears soil deeper into woven meshes; letting mud dry completely allows dry flaking without water stains.",
        type: "single_choice",
        options: ["Completely dried into crust", "Still wet and sticky"],
        required: true,
      },
    ],
    materialsNeeded: [
      "Soft-bristled brush or old clean toothbrush",
      "Warm water and mild liquid dish soap",
      "Microfiber cloth",
      "Newspaper or paper towels (for shoe stuffing)",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Let the mud dry completely",
        instruction:
          "If the mud is still wet, wait until it dries into a dry crust. Wet mud easily smears and embeds deeper into canvas and knit meshes.",
      },
      {
        stepNumber: 2,
        title: "Dry brush the bulk crust away",
        instruction:
          "Clap shoes together outside, then use a dry toothbrush or soft brush to gently knock loose the dried soil flakes.",
      },
      {
        stepNumber: 3,
        title: "Clean with mild soapy water solution",
        instruction:
          "Mix 1 teaspoon of gentle dish soap into a bowl of warm water. Dip the brush lightly, tap off excess water, and scrub the outsole and canvas in circular motions.",
        cautionNotes: "Do not saturate or submerge the entire shoe in a bucket unless the manufacturer explicitly permits it.",
      },
      {
        stepNumber: 4,
        title: "Wipe clean and air dry with paper stuffing",
        instruction:
          "Wipe away soapy foam with a damp microfiber cloth. Stuff the inside with plain paper towels to maintain shape and air-dry away from direct radiators or heaters.",
        cautionNotes: "Never put sneakers in a high-heat clothes dryer; heat melts sole adhesives and shrinks EVA foam.",
      },
    ],
    actionsToAvoid: [
      "DO NOT rub wet mud; always allow it to dry first for dry brushing",
      "DO NOT put shoes in a machine dryer (damages glue and midsole foam)",
      "DO NOT use chlorine bleach on rubber or canvas",
    ],
    safetyPrecautions: [
      "Ensure soles are fully dry before wearing to avoid slip hazards",
      "Brush outdoors to avoid inhaling fine soil particles",
    ],
    whenToStopAndSeekHelp: [
      "If the shoe is genuine suede or raw untreated leather, use a specialized suede eraser and brush; do not use soapy water",
    ],
    whyTheseStepsExplanation:
      "Mud contains insoluble mineral particulates. Dry brushing removes 80% of soil mechanically without liquid capillary action driving pigment deep into the weave.",
  },
  {
    id: "wax_household_surface",
    name: "Candle Wax on Household Surface / Table",
    keywords: ["wax", "candle", "wax spill", "crayon", "paraffin"],
    defaultStainCategory: "Solidified Paraffin / Wax Residue",
    defaultSurface: "Finished Wood, Glass, or Table Surface",
    requiredInfoKeys: ["surface_type"],
    followUpQuestions: [
      {
        id: "surface_type",
        question: "What surface is the wax stuck to?",
        reason: "Finished wood scratches easily with metal tools, whereas glass or tile can handle cautious edge scraping.",
        type: "single_choice",
        options: [
          "Finished Wood Table / Furniture",
          "Glass or Ceramic Tile",
          "Washable Tablecloth / Fabric",
          "Carpet or Rug",
        ],
        required: true,
      },
    ],
    materialsNeeded: [
      "Ice cubes in a sealed zip bag",
      "Plastic scraper or expired plastic credit card (never metal)",
      "Clean paper towels or brown craft paper",
      "Hairdryer on low heat (optional)",
      "Mild furniture cleaner or soapy cloth",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Chill the wax with ice",
        instruction:
          "Place ice cubes inside a plastic bag (to prevent moisture leaks) and rest it directly on the candle wax for 5 to 10 minutes until the wax is rock-hard and brittle.",
      },
      {
        stepNumber: 2,
        title: "Pop the wax off using a plastic edge",
        instruction:
          "Gently slide the edge of an old plastic card or plastic scraper underneath the hardened wax chunk. It should snap or peel away in large pieces.",
        cautionNotes: "NEVER use a metal knife, razor blade, or scissors on wood; it will gouge the varnish.",
      },
      {
        stepNumber: 3,
        title: "Melt thin remaining residue with low heat and paper",
        instruction:
          "Place a sheet of clean brown paper or paper towel over the thin wax film. Hover a hairdryer on low heat over the paper. The paper will wick and absorb the melted wax.",
        cautionNotes: "Keep the hairdryer moving; do not overheat wood veneer.",
      },
      {
        stepNumber: 4,
        title: "Clean the surface",
        instruction:
          "Wipe down with a damp microfiber cloth and appropriate wood polish or gentle cleaner to remove any residual oil sheen.",
      },
    ],
    actionsToAvoid: [
      "DO NOT scrape with metal knives, keys, or screwdrivers",
      "DO NOT use boiling water or an iron directly on wood finishes",
      "DO NOT spread hot liquid wax while fresh",
    ],
    safetyPrecautions: [
      "Never leave a heat source unattended",
      "Ensure candles are fully extinguished before cleaning nearby wax",
    ],
    whenToStopAndSeekHelp: [
      "If the wax has penetrated unsealed antique wood or delicate stone like marble",
    ],
    whyTheseStepsExplanation:
      "Paraffin wax contracts and becomes brittle when frozen, breaking its surface adhesive bond without abrasive friction. The remainder wicks into porous paper under low heat.",
  },
  {
    id: "dust_dirt_surfaces",
    name: "Ordinary Dust and Grime on Desks & Bookshelves",
    keywords: ["dust", "dusty", "grime", "desk", "bookshelf", "table", "dirt buildup"],
    defaultStainCategory: "Atmospheric Dust & Light Surface Grime",
    defaultSurface: "Laminate Desk, Wood Furniture, or Shelving",
    requiredInfoKeys: ["surface_material"],
    followUpQuestions: [
      {
        id: "surface_material",
        question: "What is the surface made of?",
        reason: "Laminate and plastic tolerate all-purpose spray, while unsealed solid wood needs minimal moisture.",
        type: "single_choice",
        options: ["Laminate / Engineered Wood", "Solid Hardwood", "Glass or Acrylic", "Metal"],
        required: true,
      },
    ],
    materialsNeeded: [
      "Dry electro-static microfiber cloth",
      "Lightly damp microfiber cloth (plain water)",
      "Mild dish soap (1 drop) if sticky residue is present",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Dry dust first from top to bottom",
        instruction:
          "Use a dry, high-pile microfiber cloth to wipe surfaces starting from the top shelf downward. Microfiber traps dust fibers instead of scattering them into the air.",
      },
      {
        stepNumber: 2,
        title: "Damp wipe for sticky residue",
        instruction:
          "Dampen a second cloth with clean water (wrung out until nearly dry). Wipe away any stubborn rings or finger marks.",
      },
      {
        stepNumber: 3,
        title: "Buff dry immediately",
        instruction:
          "Wipe dry with a clean cloth to prevent water marks or moisture damage to wood joints.",
      },
    ],
    actionsToAvoid: [
      "DO NOT use feather dusters (they fling dust into the room)",
      "DO NOT spray liquid cleaners directly onto electronics or electrical sockets",
      "DO NOT leave standing water on wood or laminate seams",
    ],
    safetyPrecautions: [
      "Unplug nearby electronics before cleaning surface perimeters",
      "Ventilate the room if you are sensitive to dust mites",
    ],
    whenToStopAndSeekHelp: ["If you detect mold growth or electrical shorts near wiring"],
    whyTheseStepsExplanation:
      "Static charge in split microfiber grips dust without aerosol sprays, preserving indoor air quality and surface coatings.",
  },
  {
    id: "food_oil_stains_fabric",
    name: "Food, Oil, or Sauce Stains on Washable Fabric",
    keywords: ["food", "grease", "oil", "sauce", "ketchup", "curry", "pasta", "butter"],
    defaultStainCategory: "Lipid (Grease) & Plant Pigment Stain",
    defaultSurface: "Washable Clothing / Tablecloth",
    requiredInfoKeys: ["food_type", "has_grease"],
    followUpQuestions: [
      {
        id: "has_grease",
        question: "Does the food stain contain oil, grease, or butter?",
        reason: "Grease requires a concentrated surfactant (like dish soap) to cut lipid molecules before water washing.",
        type: "single_choice",
        options: ["Yes, contains oil/grease/butter", "No, water-based (like plain fruit juice or syrup)", "Uncertain"],
        required: true,
      },
      {
        id: "fabric_washability",
        question: "Is the garment machine washable?",
        reason: "Dry-clean only silks and tailored wool suits cannot handle wet detergent treatments.",
        type: "single_choice",
        options: ["Yes, machine washable cotton or synthetic", "No, dry-clean only or delicate", "Not sure"],
        required: true,
      },
    ],
    materialsNeeded: [
      "Concentrated liquid dish soap (cuts grease)",
      "Baking soda or cornstarch (for heavy fresh oil puddles)",
      "Warm water",
      "Clean white towel",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Scrape off solids and blot oil",
        instruction:
          "Use a dull butter knife or spoon edge to gently lift away solid food pieces. Blot fresh oil with paper towels.",
      },
      {
        stepNumber: 2,
        title: "Apply grease-cutting dish soap directly",
        instruction:
          "Dab a drop of clear liquid dish soap directly onto the grease mark. Gently massage it in with your thumb and let sit for 10 minutes.",
        isCheckedTestPatch: true,
      },
      {
        stepNumber: 3,
        title: "Flush with warm water from behind",
        instruction:
          "Hold the reverse side of the stain under warm running water to flush out emulsified oils.",
      },
      {
        stepNumber: 4,
        title: "Launder normally and air-dry to check",
        instruction:
          "Wash according to the fabric care label. Inspect while damp; repeat dish soap treatment if grease shadowing remains before dryer.",
      },
    ],
    actionsToAvoid: [
      "DO NOT put garment in dryer until oil stain is confirmed gone",
      "DO NOT use chlorine bleach on colored clothing",
    ],
    safetyPrecautions: [
      "Check garment care tag for maximum washing temperature",
    ],
    whenToStopAndSeekHelp: ["If garment is marked 'Dry Clean Only'"],
    whyTheseStepsExplanation:
      "Dish detergents contain concentrated lipophilic surfactants engineered to dissolve food grease that ordinary laundry wash can miss at low temperatures.",
  },
  {
    id: "vague_upholstery_stain",
    name: "Unidentified Stain on Sofa or Upholstered Item",
    keywords: ["sofa", "couch", "upholstery", "armchair", "cushion", "settee", "loveseat"],
    defaultStainCategory: "Unidentified Stain on Upholstered Surface",
    defaultSurface: "Upholstered Furniture (Material Unknown)",
    requiredInfoKeys: ["upholstery_material", "stain_substance"],
    followUpQuestions: [
      {
        id: "upholstery_material",
        question: "What material is the sofa or upholstered item made of?",
        reason:
          "Leather, synthetic fabric, and natural fabric all require completely different cleaning agents. Using the wrong one can permanently stain or crack the surface.",
        type: "single_choice" as const,
        options: [
          "Fabric / Woven Textile (e.g. linen, polyester blend)",
          "Real or Faux Leather",
          "Velvet or Microsuede",
          "I am not sure — no visible label",
        ],
        required: true,
      },
      {
        id: "stain_substance",
        question: "What caused the stain, if you know?",
        reason:
          "Different substances (oil, water-based drink, ink, food) require different treatment chemistry. Guessing the wrong category can worsen the stain.",
        type: "single_choice" as const,
        options: [
          "Water-based drink (e.g. juice, tea, coffee)",
          "Food or oil-based (e.g. sauce, grease)",
          "Ink or dye",
          "Unknown substance",
        ],
        required: true,
      },
    ],
    materialsNeeded: [
      "Clean white microfiber cloths",
      "Mild unscented liquid soap diluted in water",
      "Cold water for rinsing",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Blot — do not rub — to absorb excess",
        instruction:
          "Press a clean white cloth gently onto the stain to absorb as much moisture as possible. Do not rub, which spreads the stain and works it into the fabric weave.",
      },
      {
        stepNumber: 2,
        title: "Check the upholstery care code label",
        instruction:
          "Look for a care tag under the cushion or on the sofa frame. W = Water-safe cleaning; S = Solvent only; WS = Both; X = Vacuum only. This determines whether moisture-based cleaning is safe.",
        isCheckedTestPatch: true,
      },
    ],
    actionsToAvoid: [
      "DO NOT scrub with colored cloths (may transfer dye)",
      "DO NOT use unknown spray cleaners without checking the upholstery care code",
      "DO NOT saturate with water if care label says S or X",
    ],
    safetyPrecautions: [
      "Always check the care code label before applying any liquid",
      "Test on a hidden seam if applying any cleaning agent",
    ],
    whenToStopAndSeekHelp: [
      "If care label says 'X' (vacuum only) or 'S' (solvent only), consult a professional upholstery cleaner",
      "For antique or high-value upholstered pieces, always seek professional advice",
    ],
    whyTheseStepsExplanation:
      "Without knowing the material and stain type, only safe general first steps are given. Material-specific treatment is deferred until both the upholstery material and the staining substance are confirmed.",
  },
  {
    id: "vague_fabric_spill",
    name: "Unknown Spill on Clothing or Fabric (Details Missing)",
    keywords: [
      "spilled on my shirt",
      "spill on shirt",
      "something on my shirt",
      "stain on my top",
      "spill on my clothes",
      "spilled on clothes",
      "spill on jeans",
      "stain on my jeans",
      "spilled on my top",
      "something spilled",
    ],
    defaultStainCategory: "Unidentified Spill on Fabric Garment",
    defaultSurface: "Fabric Garment (Material Unknown)",
    requiredInfoKeys: ["fabric_type", "spill_substance"],
    followUpQuestions: [
      {
        id: "spill_substance",
        question: "Do you know what the spill is?",
        reason:
          "The cleaning approach differs fundamentally between oil-based, water-based, and protein-based stains. Applying the wrong treatment first can permanently set the stain.",
        type: "single_choice" as const,
        options: [
          "Hot or cold drink (coffee, juice, tea, wine)",
          "Food with oil or grease",
          "Ink or paint",
          "Blood or protein-based substance",
          "I don't know what it is",
        ],
        required: true,
      },
      {
        id: "fabric_type",
        question: "What type of fabric is the garment made of?",
        reason:
          "Delicate fabrics like silk, wool, and viscose need special care; water-based treatments safe for cotton can irreversibly damage these materials.",
        type: "single_choice" as const,
        options: [
          "Cotton or polyester blend (everyday clothing)",
          "Silk, wool, or viscose (delicate fabric)",
          "Denim or canvas",
          "Not sure — check care label",
        ],
        required: true,
      },
    ],
    materialsNeeded: [
      "Clean white absorbent cloth or paper towels",
      "Cold water",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Blot immediately — absorb excess without rubbing",
        instruction:
          "Use a clean white paper towel or cloth to gently blot (press and lift) the spill. Avoid rubbing, which pushes the substance deeper into the fabric and spreads the affected area.",
      },
      {
        stepNumber: 2,
        title: "Check the garment care label",
        instruction:
          "Look at the inner seam label for care symbols: a tub icon means it is washable; 'Dry Clean Only' means take it to a professional. Do not apply any cleaning agent before checking.",
        isCheckedTestPatch: true,
      },
    ],
    actionsToAvoid: [
      "DO NOT rub the stain",
      "DO NOT apply hot water before knowing the stain type (heat can set many stains permanently)",
      "DO NOT use bleach without knowing the fabric type and care label",
    ],
    safetyPrecautions: [
      "Check care label before applying any cleaning product",
      "Test any treatment on a hidden inner seam first",
    ],
    whenToStopAndSeekHelp: [
      "If the garment says 'Dry Clean Only' — take it to a professional and mention the spill",
      "If the fabric is silk, fine wool, or embroidered, consult a specialist",
    ],
    whyTheseStepsExplanation:
      "Only safe, reversible first steps are provided until the fabric type and spill substance are confirmed. Material-specific treatment is deferred to prevent damage from incorrect assumptions.",
  },
  {
    id: "care_label_interpretation",
    name: "Garment Care Label Symbols & Instructions",
    keywords: ["care label", "symbol", "tag", "washing instructions", "dry clean", "bleach symbol"],
    defaultStainCategory: "Garment Care & Fabric Maintenance",
    defaultSurface: "Garment Care Label",
    requiredInfoKeys: ["tag_symbols"],
    followUpQuestions: [
      {
        id: "tag_symbols",
        question: "Which symbols or words appear on the care label?",
        reason: "Care symbols dictate safe water temperature, cycle agitation, and solvent permissions.",
        type: "single_choice",
        options: [
          "Washtub with dots or hands (Water wash)",
          "Circle with 'P' or 'F' (Dry clean)",
          "Circle with 'X' through it (Do NOT dry clean)",
          "Triangle with 'X' (Do NOT bleach)",
          "Square with circle (Tumble dry instructions)",
        ],
        required: true,
      },
    ],
    materialsNeeded: [
      "Garment care tag on inside seam",
      "Magnifying glass or phone camera zoom if symbols are small",
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Inspect the primary washtub icon",
        instruction:
          "A tub with water means machine wash. One dot = 30°C (cold); two dots = 40°C (warm); three dots = 50°C (hot). A hand in the tub means hand wash only. An 'X' through the tub means do not wash.",
      },
      {
        stepNumber: 2,
        title: "Check the triangle icon (Bleach)",
        instruction:
          "An empty triangle means any bleach is safe. A triangle with diagonal lines means non-chlorine (oxygen) bleach only. A solid black triangle or triangle with 'X' means DO NOT BLEACH.",
      },
      {
        stepNumber: 3,
        title: "Check the square icon (Drying)",
        instruction:
          "A square with a circle inside indicates tumble drying. One dot = low heat; two dots = medium; three dots = high. An 'X' through the circle means do not tumble dry (air dry or dry flat).",
      },
      {
        stepNumber: 4,
        title: "Check the circle icon (Dry Cleaning)",
        instruction:
          "A plain circle or circle with letters (P, F) indicates professional dry cleaning. An 'X' over a circle means do NOT dry clean.",
      },
    ],
    actionsToAvoid: [
      "DO NOT ignore the 'Do Not Bleach' symbol; bleach destroys spandex/elastane and dissolves silks",
      "DO NOT tumble dry garments with a crossed-out dryer symbol",
    ],
    safetyPrecautions: [
      "Follow conservative guidance when uncertain",
    ],
    whenToStopAndSeekHelp: [
      "When the garment is high-value couture, tailored suiting, or vintage heirloom",
    ],
    whyTheseStepsExplanation:
      "International ISO 3758 and ASTM D5489 care symbols standardize textile care to prevent shrinkage, fiber distortion, and dye loss.",
  },
];

/**
 * Finds matching scenario from user text
 */
export function findMatchingScenario(text: string): SupportedScenario | null {
  const lower = text.toLowerCase();
  for (const scenario of SUPPORTED_SCENARIOS) {
    for (const keyword of scenario.keywords) {
      if (lower.includes(keyword)) {
        return scenario;
      }
    }
  }
  return null;
}
