/**
 * Pre-packaged demo presets so users can test the intelligent object swap
 * workflow immediately with a single click.
 */

export interface PresetPair {
  id: string;
  title: string;
  category: string;
  description: string;
  targetHint: string;
  imageA: string; // Data URL or URL
  imageB: string; // Data URL or URL
}

// Generate high quality SVG data URLs that render clearly as realistic mock photos
function createSvgDataUrl(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const DEMO_PRESETS: PresetPair[] = [
  {
    id: 'motorcycle-grips',
    title: 'Motorcycle Cockpit Grips',
    category: 'Vehicle Controls',
    description: 'Replace worn rubber grips on a custom scrambler motorcycle with retro diamond-stitched cognac grips.',
    targetHint: 'Handlebar grips (Left & Right instances)',
    imageA: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="40%" stop-color="#475569" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="chromeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="50%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="oldGrip" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#18181b" />
            <stop offset="50%" stop-color="#27272a" />
            <stop offset="100%" stop-color="#09090b" />
          </linearGradient>
          <linearGradient id="speedo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
        </defs>
        <!-- Background Scene: Open coastal highway road view from cockpit -->
        <rect width="800" height="600" fill="url(#skyGrad)" />
        <path d="M0,320 Q400,280 800,320 L800,600 L0,600 Z" fill="#0f172a" opacity="0.8" />
        <path d="M350,300 L450,300 L580,600 L220,600 Z" fill="#1e293b" />
        <line x1="400" y1="300" x2="400" y2="600" stroke="#f59e0b" stroke-width="4" stroke-dasharray="20,15" />

        <!-- Motorcycle Triple Tree & Handlebars -->
        <path d="M120,440 Q400,390 680,440" stroke="url(#chromeGrad)" stroke-width="26" stroke-linecap="round" fill="none" />
        
        <!-- Central Round Speedometer Gauge -->
        <circle cx="400" cy="380" r="54" fill="url(#speedo)" stroke="#cbd5e1" stroke-width="6" />
        <circle cx="400" cy="380" r="46" fill="#020617" />
        <path d="M370,405 A36,36 0 1,1 430,405" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="4,4" />
        <line x1="400" y1="380" x2="425" y2="360" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
        <circle cx="400" cy="380" r="6" fill="#f8fafc" />
        <text x="400" y="415" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle" font-weight="bold">KM/H</text>

        <!-- Mirrors -->
        <line x1="220" y1="410" x2="180" y2="330" stroke="#94a3b8" stroke-width="6" />
        <circle cx="170" cy="315" r="28" fill="#334155" stroke="#cbd5e1" stroke-width="4" />
        <line x1="580" y1="410" x2="620" y2="330" stroke="#94a3b8" stroke-width="6" />
        <circle cx="630" cy="315" r="28" fill="#334155" stroke="#cbd5e1" stroke-width="4" />

        <!-- Left Clutch Lever & Controls -->
        <path d="M220,430 Q160,450 110,480" stroke="#64748b" stroke-width="8" stroke-linecap="round" fill="none" />
        <!-- Right Brake Lever & Controls -->
        <path d="M580,430 Q640,450 690,480" stroke="#64748b" stroke-width="8" stroke-linecap="round" fill="none" />

        <!-- Target Object 1: Left Handlebar Grip (Old worn black rubber) -->
        <g id="target-left-grip">
          <rect x="95" y="420" width="110" height="42" rx="14" transform="rotate(-6, 150, 441)" fill="url(#oldGrip)" stroke="#3f3f46" stroke-width="2" />
          <line x1="120" y1="421" x2="117" y2="461" stroke="#3f3f46" stroke-width="2" />
          <line x1="140" y1="423" x2="137" y2="463" stroke="#3f3f46" stroke-width="2" />
          <line x1="160" y1="425" x2="157" y2="465" stroke="#3f3f46" stroke-width="2" />
          <line x1="180" y1="427" x2="177" y2="467" stroke="#3f3f46" stroke-width="2" />
        </g>

        <!-- Target Object 2: Right Handlebar Grip (Old worn black rubber) -->
        <g id="target-right-grip">
          <rect x="595" y="420" width="110" height="42" rx="14" transform="rotate(6, 650, 441)" fill="url(#oldGrip)" stroke="#3f3f46" stroke-width="2" />
          <line x1="620" y1="427" x2="623" y2="467" stroke="#3f3f46" stroke-width="2" />
          <line x1="640" y1="425" x2="643" y2="465" stroke="#3f3f46" stroke-width="2" />
          <line x1="660" y1="423" x2="663" y2="463" stroke="#3f3f46" stroke-width="2" />
          <line x1="680" y1="421" x2="683" y2="461" stroke="#3f3f46" stroke-width="2" />
        </g>

        <!-- Foreground Rider Gloves/Hands gripping controls -->
        <ellipse cx="145" cy="455" rx="36" ry="24" fill="#3b82f6" opacity="0.35" />
        <ellipse cx="655" cy="455" rx="36" ry="24" fill="#3b82f6" opacity="0.35" />
      </svg>
    `),
    imageB: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
        <defs>
          <linearGradient id="bgStudio" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="leatherGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#9a3412" />
            <stop offset="35%" stop-color="#c2410c" />
            <stop offset="70%" stop-color="#7c2d12" />
            <stop offset="100%" stop-color="#431407" />
          </linearGradient>
          <linearGradient id="brassEnd" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#854d0e" />
          </linearGradient>
          <pattern id="diamondStitch" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8,0 L16,8 L8,16 L0,8 Z" fill="none" stroke="#fdba74" stroke-width="1.2" />
            <circle cx="8" cy="8" r="1.5" fill="#431407" />
          </pattern>
        </defs>
        <!-- Clean Studio Background -->
        <rect width="600" height="600" fill="url(#bgStudio)" />
        <ellipse cx="300" cy="460" rx="200" ry="28" fill="#94a3b8" opacity="0.4" />

        <!-- Reference Product: Pair of Premium Cognac Leather Grips -->
        <text x="300" y="80" font-family="sans-serif" font-size="20" font-weight="700" fill="#0f172a" text-anchor="middle">
          Biltwell Renegade Grips - Cognac Leather &amp; Brass
        </text>
        <text x="300" y="110" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
          Diamond-quilted full-grain leather, CNC brass end-caps
        </text>

        <!-- Grip 1 (Left) -->
        <g transform="translate(140, 180)">
          <rect x="0" y="0" width="140" height="240" rx="30" fill="url(#leatherGrad)" stroke="#431407" stroke-width="3" />
          <rect x="4" y="24" width="132" height="192" rx="10" fill="url(#diamondStitch)" opacity="0.75" />
          <!-- Brass Endcap -->
          <ellipse cx="70" cy="18" rx="55" ry="16" fill="url(#brassEnd)" stroke="#713f12" stroke-width="2" />
          <ellipse cx="70" cy="235" rx="58" ry="16" fill="url(#brassEnd)" stroke="#713f12" stroke-width="2" />
        </g>

        <!-- Grip 2 (Right) -->
        <g transform="translate(320, 180)">
          <rect x="0" y="0" width="140" height="240" rx="30" fill="url(#leatherGrad)" stroke="#431407" stroke-width="3" />
          <rect x="4" y="24" width="132" height="192" rx="10" fill="url(#diamondStitch)" opacity="0.75" />
          <!-- Brass Endcap -->
          <ellipse cx="70" cy="18" rx="55" ry="16" fill="url(#brassEnd)" stroke="#713f12" stroke-width="2" />
          <ellipse cx="70" cy="235" rx="58" ry="16" fill="url(#brassEnd)" stroke="#713f12" stroke-width="2" />
        </g>
      </svg>
    `),
  },
  {
    id: 'living-room-chair',
    title: 'Living Room Armchair Swap',
    category: 'Interior Design',
    description: 'Replace an outdated grey fabric chair in a sunlit loft with a mid-century mustard velvet accent lounger.',
    targetHint: 'Grey accent armchair near the floor lamp',
    imageA: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f1f5f9" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#78350f" />
            <stop offset="100%" stop-color="#451a03" />
          </linearGradient>
          <linearGradient id="greyChair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>
        </defs>
        <rect width="800" height="420" fill="url(#wall)" />
        <rect y="420" width="800" height="180" fill="url(#floor)" />

        <!-- Window with sunlight -->
        <rect x="80" y="60" width="180" height="260" fill="#e0f2fe" stroke="#94a3b8" stroke-width="6" />
        <polygon points="120,320 220,320 540,600 240,600" fill="#ffffff" opacity="0.25" />

        <!-- Wall art and plants -->
        <rect x="520" y="70" width="160" height="120" fill="#0f172a" stroke="#cbd5e1" stroke-width="4" />
        <circle cx="600" cy="130" r="30" fill="#f59e0b" />
        <rect x="680" y="320" width="36" height="100" fill="#b45309" />
        <circle cx="698" cy="300" r="42" fill="#15803d" />

        <!-- Target Object: Grey Armchair -->
        <ellipse cx="440" cy="490" rx="140" ry="32" fill="#020617" opacity="0.4" />
        <g id="grey-chair-target">
          <!-- Chair Legs -->
          <line x1="340" y1="460" x2="320" y2="520" stroke="#0f172a" stroke-width="8" stroke-linecap="round" />
          <line x1="520" y1="460" x2="540" y2="520" stroke="#0f172a" stroke-width="8" stroke-linecap="round" />
          <!-- Cushion & Base -->
          <rect x="330" y="360" width="200" height="90" rx="28" fill="url(#greyChair)" />
          <!-- Backrest -->
          <path d="M340,370 C340,240 520,240 520,370 Z" fill="url(#greyChair)" />
          <!-- Armrests -->
          <rect x="310" y="320" width="45" height="110" rx="16" fill="#64748b" />
          <rect x="505" y="320" width="45" height="110" rx="16" fill="#64748b" />
        </g>
      </svg>
    `),
    imageB: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
        <defs>
          <linearGradient id="mustardVelvet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="60%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#92400e" />
          </linearGradient>
          <linearGradient id="brassLeg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="#f8fafc" />
        <text x="300" y="70" font-family="sans-serif" font-size="20" font-weight="700" fill="#0f172a" text-anchor="middle">
          Nordic Velvet Shell Lounger - Ochre Yellow
        </text>
        <ellipse cx="300" cy="490" rx="160" ry="24" fill="#cbd5e1" />

        <!-- Legs -->
        <line x1="220" y1="390" x2="170" y2="480" stroke="url(#brassLeg)" stroke-width="10" stroke-linecap="round" />
        <line x1="380" y1="390" x2="430" y2="480" stroke="url(#brassLeg)" stroke-width="10" stroke-linecap="round" />
        <line x1="270" y1="390" x2="250" y2="475" stroke="url(#brassLeg)" stroke-width="8" stroke-linecap="round" />
        <line x1="330" y1="390" x2="350" y2="475" stroke="url(#brassLeg)" stroke-width="8" stroke-linecap="round" />

        <!-- Velvet Shell Seat -->
        <path d="M160,260 C140,160 460,160 440,260 C470,360 400,430 300,430 C200,430 130,360 160,260 Z" fill="url(#mustardVelvet)" stroke="#b45309" stroke-width="4" />
        <!-- Plump Tufted Cushion -->
        <ellipse cx="300" cy="360" rx="110" ry="46" fill="#f59e0b" stroke="#d97706" stroke-width="3" />
        <!-- Tufting indentation dots -->
        <circle cx="260" cy="360" r="4" fill="#78350f" />
        <circle cx="300" cy="360" r="4" fill="#78350f" />
        <circle cx="340" cy="360" r="4" fill="#78350f" />
      </svg>
    `),
  },
  {
    id: 'streetwear-sneakers',
    title: 'Sneakers Colorway Swap',
    category: 'Fashion & Footwear',
    description: 'Swap ordinary all-white kicks on a model with futuristic neon teal and infrared high-top sneakers.',
    targetHint: 'Pair of white athletic shoes (Left & Right)',
    imageA: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#475569" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="denim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1e3a8a" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="800" height="380" fill="#334155" />
        <rect y="380" width="800" height="220" fill="url(#concrete)" />
        <line x1="0" y1="380" x2="800" y2="380" stroke="#64748b" stroke-width="4" />

        <!-- Raw Denim Jeans Legs -->
        <rect x="250" y="40" width="105" height="390" rx="12" fill="url(#denim)" />
        <rect x="445" y="40" width="105" height="390" rx="12" fill="url(#denim)" />

        <!-- Left White Sneaker -->
        <ellipse cx="280" cy="495" rx="75" ry="20" fill="#020617" opacity="0.4" />
        <g id="target-left-shoe">
          <path d="M210,480 C210,440 260,420 310,430 L360,450 C380,465 370,490 350,490 L220,490 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
          <rect x="215" y="475" width="145" height="16" rx="6" fill="#e2e8f0" />
          <line x1="280" y1="440" x2="295" y2="470" stroke="#94a3b8" stroke-width="3" />
          <line x1="300" y1="442" x2="315" y2="470" stroke="#94a3b8" stroke-width="3" />
        </g>

        <!-- Right White Sneaker -->
        <ellipse cx="510" cy="495" rx="75" ry="20" fill="#020617" opacity="0.4" />
        <g id="target-right-shoe">
          <path d="M440,480 C440,440 490,420 540,430 L590,450 C610,465 600,490 580,490 L450,490 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
          <rect x="445" y="475" width="145" height="16" rx="6" fill="#e2e8f0" />
          <line x1="510" y1="440" x2="525" y2="470" stroke="#94a3b8" stroke-width="3" />
          <line x1="530" y1="442" x2="545" y2="470" stroke="#94a3b8" stroke-width="3" />
        </g>
      </svg>
    `),
    imageB: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
        <defs>
          <linearGradient id="neonTeal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
          <linearGradient id="infrared" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#be123c" />
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="#0f172a" />
        <text x="300" y="80" font-family="sans-serif" font-size="20" font-weight="700" fill="#f8fafc" text-anchor="middle">
          Cyber Runner 2099 - Infrared &amp; Cyan
        </text>
        <text x="300" y="110" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">
          Air bubble heel cushioning, reflective TPU cage, magnetic laces
        </text>

        <!-- Sneaker Illustration -->
        <g transform="translate(130, 200)">
          <!-- Sole / Air bubble -->
          <path d="M30,190 Q170,175 310,195 Q330,225 300,235 L40,235 Q15,220 30,190 Z" fill="url(#infrared)" />
          <circle cx="260" cy="215" r="14" fill="#38bdf8" opacity="0.8" />
          <circle cx="225" cy="215" r="14" fill="#38bdf8" opacity="0.8" />
          
          <!-- Upper body -->
          <path d="M40,190 C30,110 110,60 170,90 L260,130 C310,150 325,185 300,195 L30,190 Z" fill="url(#neonTeal)" stroke="#0891b2" stroke-width="4" />
          <!-- Infrared collar & heel tab -->
          <path d="M60,110 C80,60 130,50 160,80 Z" fill="url(#infrared)" />
          <!-- Neon Accents -->
          <line x1="160" y1="100" x2="250" y2="150" stroke="#fef08a" stroke-width="5" stroke-linecap="round" />
        </g>
      </svg>
    `),
  },
];
