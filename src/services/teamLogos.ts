// Team logo URLs - using ESPN's CDN for reliable, high-quality logos
// These are publicly accessible URLs that ESPN uses for their scoreboards

interface TeamInfo {
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

// Map of common opponent names to their logo URLs and colors
export const teamLogos: Record<string, TeamInfo> = {
  // Power Conference Teams
  'Ohio State': {
    name: 'Ohio State Buckeyes',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png',
    primaryColor: '#BB0000',
    secondaryColor: '#666666'
  },
  'San Jose State': {
    name: 'San Jose State Spartans',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/23.png',
    primaryColor: '#0055A2',
    secondaryColor: '#E5A823'
  },
  // Big 12 Teams
  'Colorado': {
    name: 'Colorado Buffaloes',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/38.png',
    primaryColor: '#CFB87C',
    secondaryColor: '#000000'
  },
  'Colorado State': {
    name: 'Colorado State Rams',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/36.png',
    primaryColor: '#1E4D2B',
    secondaryColor: '#C8C372'
  },
  'UTSA': {
    name: 'UTSA Roadrunners',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2636.png',
    primaryColor: '#0C2340',
    secondaryColor: '#F15A22'
  },
  'Michigan': {
    name: 'Michigan Wolverines',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png',
    primaryColor: '#00274C',
    secondaryColor: '#FFCB05'
  },
  'Oklahoma': {
    name: 'Oklahoma Sooners',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png',
    primaryColor: '#841617',
    secondaryColor: '#FFF2D7'
  },
  'OU': {
    name: 'Oklahoma Sooners',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png',
    primaryColor: '#841617',
    secondaryColor: '#FFF2D7'
  },
  'Georgia': {
    name: 'Georgia Bulldogs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
    primaryColor: '#BA0C2F',
    secondaryColor: '#000000'
  },
  'UGA': {
    name: 'Georgia Bulldogs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
    primaryColor: '#BA0C2F',
    secondaryColor: '#000000'
  },
  'Baylor': {
    name: 'Baylor Bears',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/239.png',
    primaryColor: '#003015',
    secondaryColor: '#FFB81C'
  },
  'Kansas': {
    name: 'Kansas Jayhawks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png',
    primaryColor: '#0051BA',
    secondaryColor: '#E8000D'
  },
  'Kansas State': {
    name: 'Kansas State Wildcats',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2306.png',
    primaryColor: '#512888',
    secondaryColor: '#D1D5D8'
  },
  'KSU': {
    name: 'Kansas State Wildcats',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2306.png',
    primaryColor: '#512888',
    secondaryColor: '#D1D5D8'
  },
  'K-State': {
    name: 'Kansas State Wildcats',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2306.png',
    primaryColor: '#512888',
    secondaryColor: '#D1D5D8'
  },
  'Iowa State': {
    name: 'Iowa State Cyclones',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png',
    primaryColor: '#C8102E',
    secondaryColor: '#F1BE48'
  },
  'ISU': {
    name: 'Iowa State Cyclones',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png',
    primaryColor: '#C8102E',
    secondaryColor: '#F1BE48'
  },
  'TCU': {
    name: 'TCU Horned Frogs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png',
    primaryColor: '#4D1979',
    secondaryColor: '#A3A7AC'
  },
  'Texas Tech': {
    name: 'Texas Tech Red Raiders',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png',
    primaryColor: '#CC0000',
    secondaryColor: '#000000'
  },
  'Tech': {
    name: 'Texas Tech Red Raiders',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png',
    primaryColor: '#CC0000',
    secondaryColor: '#000000'
  },
  'Oklahoma State': {
    name: 'Oklahoma State Cowboys',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/197.png',
    primaryColor: '#FF7300',
    secondaryColor: '#000000'
  },
  'OSU': {
    name: 'Oklahoma State Cowboys',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/197.png',
    primaryColor: '#FF7300',
    secondaryColor: '#000000'
  },
  'West Virginia': {
    name: 'West Virginia Mountaineers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/277.png',
    primaryColor: '#002855',
    secondaryColor: '#EAAA00'
  },
  'WVU': {
    name: 'West Virginia Mountaineers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/277.png',
    primaryColor: '#002855',
    secondaryColor: '#EAAA00'
  },
  
  // SEC Teams
  'Alabama': {
    name: 'Alabama Crimson Tide',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png',
    primaryColor: '#9E1B32',
    secondaryColor: '#828A8F'
  },
  'Arkansas': {
    name: 'Arkansas Razorbacks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/8.png',
    primaryColor: '#9D2235',
    secondaryColor: '#FFFFFF'
  },
  'Auburn': {
    name: 'Auburn Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2.png',
    primaryColor: '#0C2340',
    secondaryColor: '#DD550C'
  },
  'Florida': {
    name: 'Florida Gators',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png',
    primaryColor: '#0021A5',
    secondaryColor: '#FF4A00'
  },
  'UF': {
    name: 'Florida Gators',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png',
    primaryColor: '#0021A5',
    secondaryColor: '#FF4A00'
  },
  'LSU': {
    name: 'LSU Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/99.png',
    primaryColor: '#461D7C',
    secondaryColor: '#FDD023'
  },
  'Mississippi State': {
    name: 'Mississippi State Bulldogs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/344.png',
    primaryColor: '#660000',
    secondaryColor: '#B0B0B0'
  },
  'MSU': {
    name: 'Mississippi State Bulldogs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/344.png',
    primaryColor: '#660000',
    secondaryColor: '#B0B0B0'
  },
  'Ole Miss': {
    name: 'Ole Miss Rebels',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png',
    primaryColor: '#14213D',
    secondaryColor: '#CE1126'
  },
  'Mississippi': {
    name: 'Ole Miss Rebels',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png',
    primaryColor: '#14213D',
    secondaryColor: '#CE1126'
  },
  
  // Common Playoff/Bowl Opponents
  'Notre Dame': {
    name: 'Notre Dame Fighting Irish',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png',
    primaryColor: '#0C2340',
    secondaryColor: '#C99700'
  },
  'Penn State': {
    name: 'Penn State Nittany Lions',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png',
    primaryColor: '#041E42',
    secondaryColor: '#FFFFFF'
  },
  'USC': {
    name: 'USC Trojans',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png',
    primaryColor: '#990000',
    secondaryColor: '#FFC72C'
  },
  'Oregon': {
    name: 'Oregon Ducks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png',
    primaryColor: '#154733',
    secondaryColor: '#FEE123'
  },
  'Washington': {
    name: 'Washington Huskies',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/264.png',
    primaryColor: '#4B2E83',
    secondaryColor: '#E8D4A2'
  },
  'Clemson': {
    name: 'Clemson Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
    primaryColor: '#F56600',
    secondaryColor: '#522D80'
  },
  'Miami': {
    name: 'Miami Hurricanes',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png',
    primaryColor: '#F47321',
    secondaryColor: '#005030'
  },
  'North Carolina': {
    name: 'North Carolina Tar Heels',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png',
    primaryColor: '#7BAFD4',
    secondaryColor: '#13294B'
  },
  'UNC': {
    name: 'North Carolina Tar Heels',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png',
    primaryColor: '#7BAFD4',
    secondaryColor: '#13294B'
  },
  'Wisconsin': {
    name: 'Wisconsin Badgers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',
    primaryColor: '#C5050C',
    secondaryColor: '#FFFFFF'
  },
  'Iowa': {
    name: 'Iowa Hawkeyes',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png',
    primaryColor: '#FFCD00',
    secondaryColor: '#000000'
  },
  'Tennessee': {
    name: 'Tennessee Volunteers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png',
    primaryColor: '#FF8200',
    secondaryColor: '#FFFFFF'
  },
  'Missouri': {
    name: 'Missouri Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/142.png',
    primaryColor: '#F1B82D',
    secondaryColor: '#000000'
  },
  'Utah': {
    name: 'Utah Utes',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/254.png',
    primaryColor: '#CC0000',
    secondaryColor: '#000000'
  },
  'UCLA': {
    name: 'UCLA Bruins',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
    primaryColor: '#2D68C4',
    secondaryColor: '#F2A900'
  },
  'Stanford': {
    name: 'Stanford Cardinal',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/24.png',
    primaryColor: '#8C1515',
    secondaryColor: '#FFFFFF'
  },
  'Duke': {
    name: 'Duke Blue Devils',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/150.png',
    primaryColor: '#003087',
    secondaryColor: '#FFFFFF'
  },
  'Virginia Tech': {
    name: 'Virginia Tech Hokies',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/259.png',
    primaryColor: '#630031',
    secondaryColor: '#CF4420'
  },
  'Nebraska': {
    name: 'Nebraska Cornhuskers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png',
    primaryColor: '#E41C38',
    secondaryColor: '#FFFFFF'
  },
  'Missouri': {
    name: 'Missouri Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/142.png',
    primaryColor: '#F1B82D',
    secondaryColor: '#000000'
  },
  'Mizzou': {
    name: 'Missouri Tigers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/142.png',
    primaryColor: '#F1B82D',
    secondaryColor: '#000000'
  },
  'South Carolina': {
    name: 'South Carolina Gamecocks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png',
    primaryColor: '#73000A',
    secondaryColor: '#000000'
  },
  'Tennessee': {
    name: 'Tennessee Volunteers',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png',
    primaryColor: '#FF8200',
    secondaryColor: '#FFFFFF'
  },
  'Vanderbilt': {
    name: 'Vanderbilt Commodores',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/238.png',
    primaryColor: '#866D4B',
    secondaryColor: '#000000'
  },
  'Vandy': {
    name: 'Vanderbilt Commodores',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/238.png',
    primaryColor: '#866D4B',
    secondaryColor: '#000000'
  },
  'Kentucky': {
    name: 'Kentucky Wildcats',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png',
    primaryColor: '#0033A0',
    secondaryColor: '#FFFFFF'
  },
  'UK': {
    name: 'Kentucky Wildcats',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png',
    primaryColor: '#0033A0',
    secondaryColor: '#FFFFFF'
  },
  
  // Other Notable Teams
  'Texas A&M': {
    name: 'Texas A&M Aggies',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
    primaryColor: '#500000',
    secondaryColor: '#FFFFFF'
  },
  'A&M': {
    name: 'Texas A&M Aggies',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
    primaryColor: '#500000',
    secondaryColor: '#FFFFFF'
  },
  'Rice': {
    name: 'Rice Owls',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/242.png',
    primaryColor: '#002469',
    secondaryColor: '#7E7F83'
  },
  'Houston': {
    name: 'Houston Cougars',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF'
  },
  'UH': {
    name: 'Houston Cougars',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF'
  },
  'SMU': {
    name: 'SMU Mustangs',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2567.png',
    primaryColor: '#C8102E',
    secondaryColor: '#0033A0'
  },
  'Louisiana Monroe': {
    name: 'Louisiana Monroe Warhawks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2433.png',
    primaryColor: '#840029',
    secondaryColor: '#E4AA47'
  },
  'ULM': {
    name: 'Louisiana Monroe Warhawks',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2433.png',
    primaryColor: '#840029',
    secondaryColor: '#E4AA47'
  }
};

// Function to get team info (case-insensitive)
export function getTeamInfo(opponent: string): TeamInfo | null {
  // Try exact match first
  if (teamLogos[opponent]) {
    return teamLogos[opponent];
  }
  
  // Try case-insensitive match
  const normalizedOpponent = opponent.trim();
  for (const [key, value] of Object.entries(teamLogos)) {
    if (key.toLowerCase() === normalizedOpponent.toLowerCase()) {
      return value;
    }
  }
  
  // Try partial match (e.g., "Oklahoma State Cowboys" -> "Oklahoma State")
  for (const [key, value] of Object.entries(teamLogos)) {
    if (normalizedOpponent.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalizedOpponent.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

// Fallback logo for unknown teams
export const defaultLogo = 'https://a.espncdn.com/i/teamlogos/ncaa/500/default-team-logo-500.png';