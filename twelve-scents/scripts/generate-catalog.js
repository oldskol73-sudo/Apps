// Generates src/data/catalog.json. All names/prices/sizes except the 12 tribe sprays are placeholders.
const fs = require('fs');
const CDN = 'https://cdn.twelvescents.example/p';
const img = (id) => [`${CDN}/${id}-main.jpg`, `${CDN}/${id}-detail.jpg`, `${CDN}/${id}-inuse.jpg`];

const tribes = [
  ['reuben', 'Reuben', 'Sardius', 'I', '#8E2B25', 'Warm', ['Blood orange', 'Red clove', 'Amber'], 'The firstborn: warm, spiced and confident.'],
  ['simeon', 'Simeon', 'Topaz', 'II', '#B0822C', 'Bright', ['Bergamot', 'Golden honey', 'Cedar'], 'Sunlit honey over clean wood.'],
  ['levi', 'Levi', 'Carbuncle', 'III', '#6E1F35', 'Warm', ['Pomegranate', 'Rose', 'Frankincense'], 'Deep, priestly and resinous.'],
  ['judah', 'Judah', 'Emerald', 'IV', '#2F6E4A', 'Fresh', ['Green fig leaf', 'Cypress', 'Moss'], 'A lion-hearted green.'],
  ['issachar', 'Issachar', 'Sapphire', 'V', '#27447A', 'Grounding', ['Sea salt', 'Vetiver', 'Driftwood'], 'Steady, deep and quietly strong.'],
  ['zebulun', 'Zebulun', 'Diamond', 'VI', '#7F8C8F', 'Bright', ['Sea mist', 'White musk', 'Pearl'], 'Harbour air, crisp and luminous.'],
  ['dan', 'Dan', 'Ligure', 'VII', '#A0522D', 'Grounding', ['Cinnamon bark', 'Tobacco leaf', 'Sandalwood'], 'Burnished, dry and smoky-sweet.'],
  ['naphtali', 'Naphtali', 'Ligure', 'VIII', '#8B1E4B', 'Fresh', ['Wild mint', 'Sage', 'Oak moss'], 'A hind let loose: green and swift.'],
  ['gad', 'Gad', 'Amethyst', 'IX', '#5B3A7A', 'Warm', ['Lavender', 'Plum', 'Vanilla bean'], 'Velvet violet with a soft finish.'],
  ['asher', 'Asher', 'Agate', 'X', '#8A6A2F', 'Warm', ['Olive blossom', 'Fig', 'Myrrh'], 'Rich bread and olive oil, golden.'],
  ['joseph', 'Joseph', 'Onyx', 'XI', '#3A3430', 'Grounding', ['Black pepper', 'Oud', 'Leather'], 'Dark, polished and enduring.'],
  ['benjamin', 'Benjamin', 'Jasper', 'XII', '#8C3D2E', 'Bright', ['Pink grapefruit', 'Red cedar', 'Smoked sugar'], 'The youngest, bright and quick.'],
];
const sprays = tribes.map(([id, name, stone, numeral, colorHex, character, notes, tagline], i) => ({
  id: `spray-${id}`, category: 'spray', name, stone, numeral, colorHex, tribe: true, character, tagline,
  description: `${name}, ${stone.toLowerCase()} of the breastplate. A room spray for the home — mist over linens, in entryways, or into the air before prayer or guests arrive.`,
  details: [{ label: 'Top', value: notes[0] }, { label: 'Heart', value: notes[1] }, { label: 'Base', value: notes[2] }],
  variants: [{ id: `spray-${id}-100`, label: '100 ml room spray', price: 35 }],
  subscribable: true,
  pairings: ['incense-frankincense-myrrh', 'charcoal-quick-light', i % 2 ? 'censer-hanging-brass' : 'rock-frankincense'],
  images: img(`spray-${id}`),
}));

const mk = (id, category, name, character, tagline, description, details, variants, subscribable, pairings) =>
  ({ id, category, name, colorHex: '#C99A3F', character, tagline, description, details, variants, subscribable, pairings, images: img(id) });
const v = (id, label, price) => ({ id: `${id}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '')}`, label, price });

// Room & car fresheners: sprays outside the Twelve Tribes (names from the store, prices placeholder).
const fresheners = [
  ['lavender', 'Lavender', 'Fresh', 'Calm, clean and floral.', ['Lavender', 'Herbs', 'Soft musk']],
  ['linen-cloth', 'Linen Cloth', 'Bright', 'Fresh laundry on the line.', ['Cotton', 'White tea', 'Clean musk']],
  ['mahogany-teakwood', 'Mahogany Teakwood', 'Grounding', 'Dark wood and oak.', ['Mahogany', 'Teakwood', 'Oak moss']],
].map(([id, name, character, tagline, notes]) => ({
  id: `spray-${id}`, category: 'spray', name, colorHex: '#C99A3F', tribe: false, character, tagline,
  description: `${name} room and car freshener. Mist into the air, over fabrics or in the car.`,
  details: [{ label: 'Top', value: notes[0] }, { label: 'Heart', value: notes[1] }, { label: 'Base', value: notes[2] }],
  variants: [{ id: `spray-${id}-60`, label: '60 ml room spray', price: 15 }],
  subscribable: false,
  pairings: ['incense-frankincense-myrrh', 'charcoal-quick-light'],
  images: img(`spray-${id}`),
}));

const others = [
  mk('incense-frankincense-myrrh', 'incense', 'Frankincense & Myrrh', 'Warm', 'The old-world classic.',
    'A rich, traditional blend of frankincense and myrrh, hand-bundled for a clean, aromatic burn. Ideal for prayer, meditation, and creating a reverent atmosphere in the home.',
    [{ label: 'Base', value: 'Resin & bark' }, { label: 'Made', value: 'Hand-bundled' }, { label: 'Finish', value: 'Sweet, balsamic' }],
    [v('incense-frankincense-myrrh', 'Hand-bundled Incense', 18), v('incense-frankincense-myrrh', 'Box of 3', 48)], true, ['rock-frankincense', 'charcoal-quick-light', 'censer-hanging-brass']),
  mk('incense-sandalwood-cedar', 'incense', 'Sandalwood & Cedar', 'Grounding', 'Quiet timber.',
    'Creamy sandalwood over dry cedar, hand-bundled and slow burning.',
    [{ label: 'Base', value: 'Sandalwood' }, { label: 'Made', value: 'Hand-bundled' }, { label: 'Finish', value: 'Dry, woody' }],
    [v('incense-sandalwood-cedar', 'Hand-bundled Incense', 16)], true, ['censer-tabletop-brass']),
  mk('incense-rose-sharon', 'incense', 'Rose of Sharon', 'Fresh', 'Petals and morning air.',
    'A soft floral incense of rose petal and white tea, hand-bundled.',
    [{ label: 'Base', value: 'Rose & tea' }, { label: 'Made', value: 'Hand-bundled' }, { label: 'Finish', value: 'Light, airy' }],
    [v('incense-rose-sharon', 'Hand-bundled Incense', 16)], true, ['censer-tabletop-brass']),
  mk('incense-lavender-sage', 'incense', 'Lavender & Sage', 'Bright', 'A clearing breath.',
    'Herbal lavender and sage for a clean, bright room.',
    [{ label: 'Base', value: 'Herbs' }, { label: 'Made', value: 'Hand-bundled' }, { label: 'Finish', value: 'Clean, green' }],
    [v('incense-lavender-sage', 'Hand-bundled Incense', 16)], true, ['charcoal-quick-light']),
  mk('rock-frankincense', 'rock', 'Frankincense Tears', 'Warm', 'Resin from Oman.',
    'Hand-picked frankincense resin, burned on charcoal in a censer for a sweet, lemony smoke.',
    [{ label: 'Origin', value: 'Oman' }, { label: 'Grade', value: 'Hojari' }, { label: 'Burn', value: 'On charcoal' }],
    [v('rock-frankincense', '30 g', 14), v('rock-frankincense', '100 g', 38)], true, ['charcoal-quick-light', 'censer-hanging-brass']),
  mk('rock-myrrh', 'rock', 'Myrrh Resin', 'Grounding', 'Bitter, balsamic, ancient.',
    'Dark amber myrrh resin with a warm, medicinal sweetness.',
    [{ label: 'Origin', value: 'Somalia' }, { label: 'Grade', value: 'Select' }, { label: 'Burn', value: 'On charcoal' }],
    [v('rock-myrrh', '30 g', 14), v('rock-myrrh', '100 g', 36)], true, ['charcoal-quick-light']),
  mk('rock-copal', 'rock', 'White Copal', 'Bright', 'Pine, citrus, light.',
    'Pale copal resin that burns bright and clean.',
    [{ label: 'Origin', value: 'Mexico' }, { label: 'Grade', value: 'White' }, { label: 'Burn', value: 'On charcoal' }],
    [v('rock-copal', '30 g', 12)], false, ['charcoal-quick-light']),
  mk('oil-spikenard', 'oil', 'Spikenard Oil', 'Grounding', 'Precious and earthy.',
    'A rich, earthy burning oil. Add a few drops to a warmed dish.',
    [{ label: 'Notes', value: 'Earth, musk' }, { label: 'Size', value: '15 ml' }, { label: 'Use', value: 'Oil burner' }],
    [v('oil-spikenard', '15 ml', 24)], true, ['censer-tabletop-brass']),
  mk('oil-cedar-hyssop', 'oil', 'Cedar & Hyssop Oil', 'Fresh', 'Clean and herbal.',
    'Cedarwood and hyssop in a lightweight burning oil.',
    [{ label: 'Notes', value: 'Cedar, herb' }, { label: 'Size', value: '15 ml' }, { label: 'Use', value: 'Oil burner' }],
    [v('oil-cedar-hyssop', '15 ml', 22)], true, []),
  mk('oil-amber-oud', 'oil', 'Amber & Oud Oil', 'Warm', 'Dark honey.',
    'A deep amber burning oil with a whisper of oud.',
    [{ label: 'Notes', value: 'Amber, oud' }, { label: 'Size', value: '15 ml' }, { label: 'Use', value: 'Oil burner' }],
    [v('oil-amber-oud', '15 ml', 26)], true, []),
  mk('censer-hanging-brass', 'censer', 'Hanging Brass Censer', 'Warm', 'Chains, bells, smoke.',
    'A hand-finished brass censer on a chain, for burning resin over charcoal.',
    [{ label: 'Material', value: 'Solid brass' }, { label: 'Height', value: '18 cm' }, { label: 'Finish', value: 'Polished' }],
    [v('censer-hanging-brass', 'Brass', 68)], false, ['charcoal-quick-light', 'rock-frankincense']),
  mk('censer-tabletop-brass', 'censer', 'Tabletop Brass Censer', 'Grounding', 'A small altar.',
    'A footed brass bowl with lid, for incense, resin and oils.',
    [{ label: 'Material', value: 'Solid brass' }, { label: 'Height', value: '10 cm' }, { label: 'Finish', value: 'Antique' }],
    [v('censer-tabletop-brass', 'Brass', 54)], false, ['charcoal-quick-light']),
  mk('charcoal-quick-light', 'charcoal', 'Quick-light Charcoal', 'Grounding', 'Lit in seconds.',
    'Self-igniting charcoal discs for resin. Light one corner and wait for the glow.',
    [{ label: 'Count', value: '10 discs' }, { label: 'Size', value: '33 mm' }, { label: 'Burn', value: '~45 min' }],
    [v('charcoal-quick-light', '10 discs', 8), v('charcoal-quick-light', '30 discs', 20)], true, ['rock-frankincense']),
];

const catalog = { version: 1, products: [...sprays, ...fresheners, ...others] };
fs.writeFileSync(__dirname + '/../src/data/catalog.json', JSON.stringify(catalog, null, 2));
console.log('products:', catalog.products.length);
