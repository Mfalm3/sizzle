// Recipe ingredient names (lowercased, exactly as TheMealDB writes them) -> USDA SR Legacy foods.
//
// Curated by hand, because picking a food automatically is where nutrition data goes silently
// wrong ("tomato" is not "Tomatoes, yellow, raw"; "corn flour" is cornstarch in the UK and maize
// flour in the US). Each entry is one of:
//   food(description, names)        exact match
//   approx(description, names)      closest USDA food, shown with a "≈" in the breakdown
//   unknown(reason, names)          deliberately not counted, with the reason shown to readers
// `description` must match an SR Legacy food description exactly; build.js fails if it doesn't.
// Names not listed here are "not counted" until someone maps them. Covers the ~200 most used
// names, about 80% of all ingredient uses.

const food = (description, names) => ({ description, names, approx: false })
const approx = (description, names) => ({ description, names, approx: true })
const unknown = (reason, names) => ({ description: null, names, reason })

module.exports = [
  // Seasoning and basics
  food("Salt, table", [
    "salt",
    "kosher salt",
    "sea salt",
    "sea salt flakes",
    "table salt",
  ]),
  food("Spices, pepper, black", [
    "black pepper",
    "ground black pepper",
    "black peppercorns",
    "peppercorns",
  ]),
  unknown(
    "“Pepper” is used for both black pepper and bell peppers in these recipes",
    ["pepper"]
  ),
  food("Water, bottled, generic", [
    "water",
    "boiling water",
    "cold water",
    "warm water",
    "hot water",
    "ice water",
  ]),

  // Oils and fats
  food("Oil, olive, salad or cooking", ["olive oil", "extra virgin olive oil"]),
  food("Oil, soybean, salad or cooking", [
    "vegetable oil",
    "oil",
    "cooking oil",
    "high heat cooking oil",
  ]),
  food("Oil, sunflower, linoleic, (approx. 65%)", ["sunflower oil"]),
  food("Oil, canola", ["canola oil", "rapeseed oil"]),
  food("Oil, sesame, salad or cooking", [
    "sesame seed oil",
    "sesame oil",
    "toasted sesame oil",
  ]),
  food("Oil, coconut", ["coconut oil"]),
  food("Butter, salted", ["butter", "melted butter", "salted butter"]),
  food("Butter, without salt", ["unsalted butter"]),

  // Dairy and eggs
  food("Milk, whole, 3.25% milkfat, with added vitamin D", [
    "milk",
    "whole milk",
  ]),
  food("Egg, whole, raw, fresh", [
    "egg",
    "eggs",
    "free-range eggs, beaten",
    "free-range egg, beaten",
    "large eggs",
  ]),
  food("Egg, yolk, raw, fresh", ["egg yolks", "egg yolk"]),
  food("Egg, white, raw, fresh", ["egg white", "egg whites"]),
  food("Cream, fluid, heavy whipping", [
    "double cream",
    "heavy cream",
    "whipping cream",
    "thickened cream",
  ]),
  food("Cream, sour, cultured", ["sour cream"]),
  unknown("No USDA entry; crème fraîche is richer than sour cream", [
    "creme fraiche",
    "crème fraîche",
  ]),
  food("Yogurt, Greek, plain, whole milk", ["greek yogurt"]),
  food("Yogurt, plain, whole milk", [
    "yogurt",
    "natural yogurt",
    "plain yogurt",
  ]),
  food("Cheese, parmesan, hard", [
    "parmesan",
    "parmesan cheese",
    "parmigiano-reggiano",
  ]),
  food("Cheese, mozzarella, whole milk", ["mozzarella", "mozzarella cheese"]),
  food(
    "Cheese, cheddar (Includes foods for USDA's Food Distribution Program)",
    ["cheddar cheese", "cheddar"]
  ),
  food("Cheese, feta", ["feta", "feta cheese"]),
  food("Cheese, cream", ["cream cheese"]),
  food("Milk, canned, condensed, sweetened", [
    "condensed milk",
    "sweetened condensed milk",
  ]),
  food(
    "Milk, canned, evaporated, with added vitamin D and without added vitamin A",
    ["evaporated milk"]
  ),

  // Flours, grains, bread, baking
  food("Wheat flour, white, all-purpose, enriched, bleached", [
    "flour",
    "plain flour",
    "all purpose flour",
    "all-purpose flour",
  ]),
  food("Wheat flour, white, all-purpose, self-rising, enriched", [
    "self-raising flour",
    "self raising flour",
  ]),
  food("Cornstarch", ["cornstarch", "cornflour"]),
  unknown("“Corn flour” means cornstarch in the UK but maize flour in the US", [
    "corn flour",
  ]),
  food(
    "Leavening agents, baking powder, double-acting, sodium aluminum sulfate",
    ["baking powder"]
  ),
  food("Leavening agents, baking soda", [
    "baking soda",
    "bicarbonate of soda",
    "bicarbonate soda",
  ]),
  food("Leavening agents, yeast, baker's, active dry", [
    "yeast",
    "dried yeast",
    "active dry yeast",
  ]),
  food("Rice, white, long-grain, regular, raw, enriched", [
    "rice",
    "white rice",
    "long grain rice",
    "basmati rice",
    "jasmine rice",
  ]),
  food("Bread, crumbs, dry, grated, plain", [
    "breadcrumbs",
    "bread crumbs",
    "dried breadcrumbs",
  ]),
  approx("Bread, white, commercially prepared (includes soft bread crumbs)", [
    "bread",
    "white bread",
  ]),
  food("Bread, french or vienna (includes sourdough)", [
    "baguette",
    "french bread",
  ]),
  food("Bread, pita, white, enriched", ["pita bread"]),
  food("Puff pastry, frozen, ready-to-bake", ["puff pastry"]),

  // Sugar and sweet things
  food("Sugars, granulated", [
    "sugar",
    "caster sugar",
    "granulated sugar",
    "white sugar",
  ]),
  food("Sugars, brown", [
    "brown sugar",
    "muscovado sugar",
    "light brown sugar",
    "dark brown sugar",
    "soft brown sugar",
  ]),
  food("Sugars, powdered", [
    "icing sugar",
    "powdered sugar",
    "confectioners sugar",
  ]),
  food("Honey", ["honey", "clear honey"]),
  food("Vanilla extract", ["vanilla extract", "vanilla"]),
  food("Chocolate, dark, 70-85% cacao solids", ["dark chocolate"]),
  food(
    "Raisins, dark, seedless (Includes foods for USDA's Food Distribution Program)",
    ["raisins"]
  ),
  food("Dulce de Leche", ["dulce de leche"]),

  // Vegetables
  food("Onions, raw", [
    "onion",
    "onions",
    "red onions",
    "red onion",
    "chopped onion",
    "white onion",
    "yellow onion",
    "brown onion",
  ]),
  food("Onions, spring or scallions (includes tops and bulb), raw", [
    "spring onions",
    "scallions",
    "green onions",
    "spring onion",
  ]),
  food("Garlic, raw", [
    "garlic",
    "garlic clove",
    "garlic cloves",
    "minced garlic",
  ]),
  food("Shallots, raw", ["shallots", "shallot"]),
  food("Leeks, (bulb and lower leaf-portion), raw", ["leek", "leeks"]),
  food("Potatoes, flesh and skin, raw", ["potatoes", "potato"]),
  food("Carrots, raw", ["carrots", "carrot"]),
  food("Celery, raw", ["celery"]),
  food("Tomatoes, red, ripe, raw, year round average", [
    "tomato",
    "tomatoes",
    "cherry tomatoes",
    "plum tomatoes",
    "beef tomatoes",
  ]),
  approx("Tomatoes, red, ripe, canned, packed in tomato juice", [
    "tinned tomatos",
    "tinned tomatoes",
    "chopped tomatoes",
    "canned tomatoes",
    "diced tomatoes",
  ]),
  food("Tomato products, canned, puree, without salt added", ["tomato puree"]),
  food(
    "Tomato products, canned, paste, without salt added (Includes foods for USDA's Food Distribution Program)",
    ["tomato paste"]
  ),
  food("Peppers, sweet, red, raw", [
    "red pepper",
    "red bell pepper",
    "red peppers",
  ]),
  food("Peppers, sweet, green, raw", ["green pepper", "green bell pepper"]),
  food("Peppers, sweet, yellow, raw", ["yellow pepper"]),
  food("Peppers, hot chili, red, raw", [
    "red chilli",
    "red chillies",
    "chilli",
    "red chili",
  ]),
  food("Peppers, hot chili, green, raw", [
    "green chilli",
    "green chillies",
    "green chili",
  ]),
  approx("Peppers, hot chili, red, raw", [
    "scotch bonnet",
    "scotch bonnet pepper",
  ]),
  food("Ginger root, raw", ["ginger", "fresh ginger"]),
  food("Cucumber, with peel, raw", ["cucumber"]),
  food("Mushrooms, white, raw", ["mushrooms", "button mushrooms"]),
  food("Cabbage, raw", ["cabbage", "white cabbage"]),
  food("Spinach, raw", ["spinach"]),
  food("Eggplant, raw", ["aubergine", "egg plants", "eggplant"]),
  food("Squash, summer, zucchini, includes skin, raw", [
    "courgettes",
    "courgette",
    "zucchini",
  ]),
  food("Beans, snap, green, raw", ["green beans"]),
  food("Corn, sweet, yellow, raw", ["sweetcorn", "sweet corn", "corn"]),
  food("Peas, green, raw", ["peas", "frozen peas"]),
  food("Broccoli, raw", ["broccoli"]),
  food("Beets, raw", ["beetroot"]),
  food("Pumpkin, raw", ["pumpkin"]),
  approx("Lettuce, iceberg (includes crisphead types), raw", ["lettuce"]),
  food("Avocados, raw, all commercial varieties", ["avocado"]),
  food("Mung beans, mature seeds, sprouted, raw", ["bean sprouts"]),
  food("Olives, ripe, canned (small-extra large)", ["black olives"]),

  // Fruit
  food("Lemons, raw, without peel", ["lemon", "lemons"]),
  food("Lemon juice, raw", ["lemon juice"]),
  food("Lemon peel, raw", ["lemon zest"]),
  food("Limes, raw", ["lime", "limes"]),
  food("Lime juice, raw", ["lime juice"]),
  food("Oranges, raw, all commercial varieties", ["orange", "oranges"]),

  // Herbs and spices
  food("Parsley, fresh", [
    "parsley",
    "chopped parsley",
    "flat leaf parsley",
    "parsley leaves",
  ]),
  food("Coriander (cilantro) leaves, raw", [
    "coriander",
    "cilantro",
    "coriander leaves",
    "fresh coriander",
  ]),
  food("Spearmint, fresh", ["mint", "mint leaves", "fresh mint"]),
  food("Basil, fresh", ["basil", "basil leaves", "fresh basil"]),
  food("Dill weed, fresh", ["dill"]),
  food("Rosemary, fresh", ["rosemary"]),
  food("Thyme, fresh", ["thyme", "fresh thyme"]),
  food("Chives, raw", ["chives"]),
  food("Spices, bay leaf", ["bay leaf", "bay leaves"]),
  food("Spices, oregano, dried", ["oregano", "dried oregano"]),
  food("Spices, paprika", ["paprika", "smoked paprika", "sweet paprika"]),
  food("Spices, cumin seed", ["cumin", "ground cumin", "cumin seeds"]),
  food("Spices, cinnamon, ground", ["cinnamon", "ground cinnamon"]),
  approx("Spices, cinnamon, ground", ["cinnamon stick", "cinnamon sticks"]),
  food("Spices, nutmeg, ground", ["nutmeg", "ground nutmeg"]),
  food("Spices, allspice, ground", ["allspice", "ground allspice"]),
  food("Spices, cardamom", ["cardamom", "cardamom pods"]),
  food("Spices, ginger, ground", ["ground ginger"]),
  food("Spices, turmeric, ground", ["turmeric", "ground turmeric"]),
  food("Spices, cloves, ground", ["cloves"]),
  food("Spices, saffron", ["saffron"]),
  food("Spices, pepper, red or cayenne", ["cayenne pepper", "cayenne"]),
  approx("Spices, pepper, red or cayenne", [
    "chilli flakes",
    "red pepper flakes",
  ]),
  food("Spices, chili powder", ["chilli powder", "chili powder"]),
  food("Spices, curry powder", ["curry powder"]),
  food("Spices, garlic powder", ["garlic powder"]),
  unknown("No USDA entry for this spice blend", [
    "garam masala",
    "harissa spice",
  ]),

  // Sauces, stocks and condiments
  food("Soy sauce made from soy and wheat (shoyu)", [
    "soy sauce",
    "light soy sauce",
    "dark soy sauce",
  ]),
  food("Sauce, fish, ready-to-serve", ["fish sauce"]),
  food("Sauce, oyster, ready-to-serve", ["oyster sauce"]),
  food("Sauce, worcestershire", ["worcestershire sauce"]),
  food("Catsup", ["tomato ketchup", "ketchup"]),
  food("Soup, stock, chicken, home-prepared", ["chicken stock"]),
  food("Soup, stock, beef, home-prepared", ["beef stock"]),
  approx("Soup, vegetable broth, ready to serve", ["vegetable stock"]),
  food("Salad dressing, mayonnaise, regular", ["mayonnaise"]),
  approx("Mustard, prepared, yellow", ["mustard"]),
  food("Vinegar, red wine", ["red wine vinegar"]),
  approx("Vinegar, red wine", ["white wine vinegar"]),
  food("Vinegar, distilled", ["vinegar", "white vinegar"]),
  food("Vinegar, cider", ["cider vinegar", "apple cider vinegar"]),
  approx("Vinegar, distilled", ["rice vinegar"]),
  food(
    "Nuts, coconut milk, canned (liquid expressed from grated meat and water)",
    ["coconut milk"]
  ),
  unknown("Curry pastes vary too much by brand to count", [
    "thai red curry paste",
    "thai green curry paste",
  ]),
  food("Alcoholic beverage, wine, table, white", [
    "white wine",
    "dry white wine",
  ]),
  food("Alcoholic beverage, wine, table, red", ["red wine"]),

  // Nuts, seeds, pulses
  food("Nuts, almonds", ["almonds", "ground almonds", "flaked almonds"]),
  food("Nuts, walnuts, english", ["walnuts"]),
  food("Peanuts, all types, raw", ["peanuts"]),
  food("Peanut butter, smooth style, without salt", ["peanut butter"]),
  food("Seeds, sesame seeds, whole, dried", ["sesame seed", "sesame seeds"]),
  food("Nuts, coconut meat, dried (desiccated), not sweetened", [
    "desiccated coconut",
  ]),
  approx(
    "Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids",
    ["chickpeas"]
  ),
  approx("Beans, kidney, red, mature seeds, canned, drained solids", [
    "kidney beans",
  ]),

  // Meat and seafood
  food(
    "Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw",
    ["chicken breast", "chicken breasts"]
  ),
  food("Chicken, broilers or fryers, thigh, meat and skin, raw", [
    "chicken thighs",
    "chicken thigh",
  ]),
  food("Chicken, broilers or fryers, meat and skin, raw", ["chicken"]),
  food("Beef, ground, 80% lean meat / 20% fat, raw", [
    "minced beef",
    "ground beef",
    "beef mince",
  ]),
  unknown("“Beef” doesn't say which cut, and cuts differ a lot in fat", [
    "beef",
  ]),
  food("Pork, fresh, ground, raw", [
    "ground pork",
    "pork mince",
    "minced pork",
  ]),
  unknown("“Pork” doesn't say which cut, and cuts differ a lot in fat", [
    "pork",
  ]),
  food("Lamb, ground, raw", ["lamb mince", "minced lamb", "ground lamb"]),
  unknown("“Lamb” doesn't say which cut, and cuts differ a lot in fat", [
    "lamb",
  ]),
  food("Pork, cured, bacon, unprepared", ["bacon"]),
  food("Sausage, pork, chorizo, link or ground, raw", ["chorizo"]),
  approx("Ham, sliced, regular (approximately 11% fat)", ["ham"]),
  unknown("“Sausages” doesn't say what kind", ["sausages"]),
  food("Crustaceans, shrimp, raw", [
    "prawns",
    "raw king prawns",
    "king prawns",
    "shrimp",
  ]),
  food("Mollusks, squid, mixed species, raw", ["squid"]),
  food("Fish, salmon, Atlantic, farmed, raw", ["salmon"]),
]
