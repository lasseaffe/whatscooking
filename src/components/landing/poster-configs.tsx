import type { PosterConfig } from './RecipePoster'

// ─── Monogram SVGs ────────────────────────────────────────────────────────────

// Carbonara: abstract geometry (circles + tesserae + fresco cracks)
const CarbonaraMonogram = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}
    viewBox="0 0 500 750"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <circle cx="78%" cy="-5%" r="52%" fill="#8B2513" opacity="0.82" />
    <circle cx="20%" cy="8%" r="30%" fill="#3D5A6A" opacity="0.18" />
    <rect x="8%"  y="42%" width="6" height="6" fill="#C8A040" opacity="0.50" transform="rotate(18,40,315)" />
    <rect x="14%" y="55%" width="4" height="4" fill="#8B2513" opacity="0.45" transform="rotate(-8,70,412)" />
    <rect x="82%" y="48%" width="5" height="5" fill="#C8A040" opacity="0.40" transform="rotate(31,410,360)" />
    <rect x="88%" y="60%" width="3" height="3" fill="#3D5A6A" opacity="0.40" transform="rotate(12,440,450)" />
    <rect x="75%" y="72%" width="4" height="4" fill="#C8A040" opacity="0.35" transform="rotate(-22,375,540)" />
    <rect x="5%"  y="68%" width="5" height="5" fill="#8B2513" opacity="0.30" transform="rotate(45,25,510)" />
    <rect x="92%" y="78%" width="4" height="4" fill="#C8A040" opacity="0.40" transform="rotate(8,460,585)" />
    <rect x="3%"  y="82%" width="3" height="3" fill="#3D5A6A" opacity="0.35" transform="rotate(-15,15,615)" />
    <rect x="60%" y="40%" width="3" height="3" fill="#8B2513" opacity="0.30" transform="rotate(20,300,300)" />
    <rect x="22%" y="72%" width="5" height="5" fill="#C8A040" opacity="0.28" transform="rotate(-30,110,540)" />
    <line x1="72%" y1="0"   x2="68%" y2="35%"  stroke="rgba(200,168,110,0.07)" strokeWidth="0.8" />
    <line x1="80%" y1="5%"  x2="85%" y2="28%"  stroke="rgba(200,168,110,0.05)" strokeWidth="0.6" />
    <line x1="15%" y1="55%" x2="12%" y2="72%"  stroke="rgba(200,168,110,0.05)" strokeWidth="0.6" />
    <line x1="0"   y1="52%"   x2="100%" y2="52%"   stroke="rgba(200,168,110,0.07)" strokeWidth="1" />
    <line x1="0"   y1="52.5%" x2="100%" y2="52.5%" stroke="rgba(200,168,110,0.03)" strokeWidth="0.5" />
  </svg>
)

// Fleur-de-lis path (Wikipedia CC0, Flanker 2006) — used in Croissant monogram + divider
const FLEUR_PATH = "M 79.5,14.124625 C 76.48906,22.876132 60.82348,25.34967 60.82348,39.345173 C 60.82348,53.080202 77.19889,56.126476 77.55996,108.54966 L 76.17008,108.54966 C 76.31772,102.73222 75.9654,83.219277 65.34059,67.953556 C 63.79012,64.183389 62.59963,60.10142 63.37159,55.35776 C 61.6111,56.707473 60.63827,58.935022 60.41809,62.017606 C 59.1603,60.691585 57.9751,59.456207 56.82757,58.282301 C 54.663,52.631233 58.6846,44.973834 51.35491,42.240759 C 54.5658,47.990162 52.4651,50.657893 52.74479,54.17057 C 49.49202,50.973838 46.88458,48.609201 44.69507,46.69996 C 44.4167,45.965602 44.24894,45.145268 44.26073,44.151845 C 42.40785,44.668178 40.62249,43.5384 40.43856,42.211803 C 40.00127,39.057777 44.78194,39.982202 44.78193,39.982202 C 45.31563,38.881168 43.87961,34.588087 40.32273,35.551957 C 36.77005,36.514691 37.54298,39.432041 37.54297,39.432041 C 36.37642,35.987883 34.24533,35.018414 31.92554,35.059707 C 30.87109,35.078477 29.71611,35.425783 28.65352,35.725692 C 28.42265,39.251195 28.93094,43.042805 34.18409,43.659595 C 34.18409,43.659595 31.14315,43.516935 30.94104,47.19221 C 30.7387,50.871811 35.24518,51.38915 36.211,50.637956 C 36.211,50.637956 34.33807,46.118038 37.51402,45.889196 C 38.84984,45.792943 40.29729,47.299337 40.17795,49.219119 C 41.37994,48.94835 42.41415,48.99641 43.33414,49.219119 C 45.43992,51.068269 47.90439,53.352888 50.97849,56.371215 C 46.9291,55.976602 44.60498,58.987448 38.06418,56.139568 C 41.51789,63.18855 48.77952,58.372685 54.62692,60.019653 C 56.04861,61.468708 57.54894,62.990331 59.14404,64.681545 C 59.22461,64.766976 59.29602,64.856146 59.37568,64.942148 C 55.2792,64.464269 52.32008,65.210738 50.51519,67.171748 C 55.75405,66.796843 60.00861,68.680113 63.8928,70.79123 C 73.1253,85.126519 73.49105,103.23844 73.39032,108.54966 L 71.07385,108.54966 C 71.52167,91.123336 60.74958,68.648497 41.74157,68.648497 C 32.30413,68.648495 25.35257,75.303435 25.35256,84.718995 C 25.35255,105.46754 52.51316,95.101817 52.51315,107.79681 C 52.51316,114.68603 44.51367,113.58249 44.3476,113.55903 C 44.55887,110.73496 46.51929,111.44813 46.51929,109.30252 C 46.51929,107.17224 44.53328,107.10283 43.01563,105.5093 C 41.49799,107.10283 39.54094,107.17224 39.54092,109.30252 C 39.54092,111.34475 41.32941,110.80433 41.68366,113.1826 C 38.8222,112.98388 39.52292,111.01091 37.36924,111.01091 C 35.23896,111.0109 35.16955,112.99693 33.57602,114.51457 C 35.16955,116.03221 35.23896,117.98926 37.36924,117.98927 C 39.52292,117.98927 38.8222,116.01631 41.68366,115.81758 C 41.32546,118.18292 39.54093,117.65865 39.54092,119.69767 C 39.54093,121.82795 41.498,121.89736 43.01563,123.49088 C 44.53327,121.89736 46.5193,121.82795 46.51929,119.69767 C 46.51929,117.58003 44.60078,118.22549 44.3476,115.52802 C 44.51503,115.54569 55.23501,116.63594 55.235,106.87022 C 55.23499,96.577507 46.14287,96.489797 46.14286,88.975506 C 46.14286,85.348162 48.60916,83.821364 52.36837,83.821364 C 61.71481,83.821367 68.36056,97.545207 68.46782,108.54966 L 67.65706,108.54966 C 64.58824,108.54966 62.12649,111.01141 62.12649,114.08023 C 62.12649,117.14905 64.58824,119.63976 67.65706,119.63976 L 73.65092,119.63976 C 71.49047,125.28382 65.33471,127.37097 59.89689,127.37097 C 50.53724,127.37097 45.17473,130.82808 44.3476,137.01327 C 47.2393,132.42079 50.59603,134.07765 53.61347,133.04632 C 56.63881,132.01228 58.37099,129.19519 62.6477,129.19519 C 59.59196,130.79248 58.06474,132.57901 58.24641,134.58098 C 59.91581,133.02535 62.4497,133.44215 64.1534,132.43824 C 65.88518,131.41778 66.82258,128.33173 69.48128,127.13932 C 68.34687,128.54903 67.02748,130.50681 66.67256,132.00391 C 68.51709,130.27609 70.35695,130.42368 71.73983,129.33997 C 73.16465,128.22338 73.28801,126.05823 75.61992,125.40197 C 75.10831,128.59765 73.22082,133.5488 66.49882,135.47861 C 59.59566,137.46044 55.54336,141.7103 55.35082,148.16127 C 58.42918,143.97479 59.7221,144.61869 62.03962,142.92026 C 64.39385,141.19495 64.16463,139.52261 66.67256,137.99777 C 65.87991,139.64857 65.16651,141.33447 65.36955,143.38356 C 66.61004,141.57886 69.04129,141.31377 71.50819,139.04018 C 73.14223,137.53416 73.09322,134.84158 74.69333,134.84158 C 75.78164,134.84158 76.60442,135.71438 76.60442,137.15805 C 76.60442,139.46504 73.87122,141.7545 72.57955,144.97613 C 71.29418,148.18208 72.34791,153.02585 72.34791,153.02585 C 74.41988,152.59896 76.21001,150.92523 77.87847,148.68248 C 77.87848,151.15469 76.08321,152.74407 76.08321,154.29991 C 76.08321,157.53127 78.40869,158.55649 79.47105,160.75707 C 80.5334,158.55649 82.88784,157.53127 82.88784,154.29991 C 82.88784,152.74407 81.06363,151.15469 81.06362,148.68248 C 82.73208,150.92523 84.55115,152.59896 86.62314,153.02585 C 86.62314,153.02585 87.67687,148.18208 86.3915,144.97613 C 85.09983,141.7545 82.36662,139.46504 82.36663,137.15805 C 82.36663,135.71438 83.18939,134.84158 84.27772,134.84158 C 85.87782,134.84158 85.82881,137.53416 87.46286,139.04018 C 89.92976,141.31377 92.36101,141.57886 93.6015,143.38356 C 93.80454,141.33447 93.09113,139.64857 92.29849,137.99777 C 94.80642,139.52261 94.57722,141.19495 96.93143,142.92026 C 99.24895,144.61869 100.54185,143.97479 103.62022,148.16127 C 103.42768,141.7103 99.37539,137.46044 92.47223,135.47861 C 85.75023,133.5488 83.86274,128.59765 83.35113,125.40197 C 85.68304,126.05823 85.80639,128.22338 87.23122,129.33997 C 88.6141,130.42368 90.45395,130.27609 92.29849,132.00391 C 91.94357,130.50681 90.62419,128.54903 89.48977,127.13932 C 92.14847,128.33173 93.08586,131.41778 94.81765,132.43824 C 96.52135,133.44215 99.05523,133.02535 100.72464,134.58098 C 100.9063,132.57901 99.37909,130.79248 96.32335,129.19519 C 100.60005,129.19519 102.33224,132.01228 105.35757,133.04632 C 108.37501,134.07765 111.73174,132.42079 114.62345,137.01327 C 113.7963,130.82808 108.43382,127.37097 99.07416,127.37097 C 93.63424,127.37097 87.47833,125.28877 85.32013,119.63976 L 91.34295,119.63976 C 94.41177,119.63976 96.87351,117.14905 96.87351,114.08023 C 96.87351,111.01141 94.41176,108.54966 91.34295,108.54966 L 90.53218,108.54966 C 90.63945,97.545207 97.2852,83.821367 106.63163,83.821364 C 110.39085,83.821364 112.85714,85.348162 112.85714,88.975506 C 112.85714,96.489797 103.76501,96.577507 103.765,106.87022 C 103.765,116.63594 114.48497,115.54569 114.6524,115.52802 C 114.39923,118.22549 112.48071,117.58003 112.48071,119.69767 C 112.48071,121.82795 114.46673,121.89736 115.98437,123.49088 C 117.50201,121.89736 119.45907,121.82795 119.45907,119.69767 C 119.45907,117.65865 117.67454,118.18292 117.31634,115.81758 C 120.17781,116.01631 119.47708,117.98927 121.63076,117.98927 C 123.76105,117.98926 123.83045,116.03221 125.42398,114.51457 C 123.83046,112.99693 123.76104,111.0109 121.63076,111.01091 C 119.47709,111.01091 120.1778,112.98388 117.31634,113.1826 C 117.67059,110.80433 119.45907,111.34475 119.45907,109.30252 C 119.45907,107.17224 117.50201,107.10283 115.98437,105.5093 C 114.46673,107.10283 112.48071,107.17224 112.48071,109.30252 C 112.48071,111.44813 114.44113,110.73496 114.6524,113.55903 C 114.48634,113.58249 106.48684,114.68603 106.48685,107.79681 C 106.48685,95.101817 133.64745,105.46754 133.64744,84.718995 C 133.64744,75.303435 126.69587,68.648495 117.25843,68.648497 C 98.25042,68.648497 87.44938,91.123336 87.8972,108.54966 L 85.60969,108.54966 C 85.50896,103.23844 85.8747,85.126519 95.10721,70.79123 C 98.99141,68.680113 103.24595,66.796843 108.48481,67.171748 C 106.67993,65.210738 103.7208,64.464269 99.62432,64.942148 C 99.704,64.856146 99.77539,64.766976 99.85597,64.681545 C 101.45107,62.990331 102.95139,61.468708 104.37308,60.019653 C 110.22049,58.372685 117.48211,63.18855 120.93582,56.139568 C 114.39503,58.987448 112.0709,55.976602 108.02151,56.371215 C 111.09561,53.352888 113.56008,51.068269 115.66586,49.219119 C 116.58586,48.99641 117.62006,48.94835 118.82205,49.219119 C 118.70272,47.299337 120.15016,45.792943 121.48598,45.889196 C 124.66194,46.118038 122.789,50.637956 122.789,50.637956 C 123.75483,51.38915 128.2613,50.871811 128.05896,47.19221 C 127.85686,43.516935 124.81591,43.659595 124.81591,43.659595 C 130.06907,43.042805 130.57735,39.251195 130.34648,35.725692 C 129.2839,35.425783 128.12891,35.078477 127.07446,35.059707 C 124.75468,35.018414 122.62358,35.987883 121.45703,39.432041 C 121.45703,39.432041 122.22995,36.514691 118.67727,35.551957 C 115.12039,34.588087 113.68437,38.881168 114.21807,39.982202 C 114.21807,39.982202 118.99873,39.057777 118.56144,42.211803 C 118.37752,43.5384 116.59215,44.668178 114.73927,44.151845 C 114.75107,45.145268 114.5833,45.965602 114.30493,46.69996 C 112.11543,48.609201 109.50798,50.973838 106.25521,54.17057 C 106.53491,50.657893 104.4342,47.990162 107.64509,42.240759 C 100.31541,44.973834 104.33699,52.631233 102.17243,58.282301 C 101.02491,59.456207 99.83971,60.691585 98.58191,62.017606 C 98.36174,58.935022 97.3889,56.707473 95.62841,55.35776 C 96.40038,60.10142 95.20988,64.183389 93.65942,67.953556 C 83.03461,83.219277 82.68228,102.73222 82.82993,108.54966 L 81.44004,108.54966 C 81.80115,56.126631 98.14757,53.080188 98.14757,39.345173 C 98.14757,25.34967 82.51093,22.876132 79.5,14.124625 z"

// Croissant monogram: fleur-de-lis trellis (28×28 tile, 10px gap at intersections)
const CroissantMonogram = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.085 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="trellis-fdl" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <line x1="0"  y1="0"  x2="4"  y2="4"  stroke="#5a2e0a" strokeWidth="0.6" />
        <line x1="24" y1="24" x2="28" y2="28" stroke="#5a2e0a" strokeWidth="0.6" />
        <line x1="28" y1="0"  x2="24" y2="4"  stroke="#5a2e0a" strokeWidth="0.6" />
        <line x1="4"  y1="24" x2="0"  y2="28" stroke="#5a2e0a" strokeWidth="0.6" />
        <g transform="translate(14,14) scale(0.069) translate(-79.5,-93)" fill="#5a2e0a">
          <path d={FLEUR_PATH} />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#trellis-fdl)" />
  </svg>
)

// Ramen monogram: seigaiha wave scales (青海波)
const RamenMonogram = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.085 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="seigaiha" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,20 A10,10 0 0,1 20,20 Z" fill="rgba(196,30,58,0.08)" stroke="#C41E3A" strokeWidth="0.55" />
        <path d="M-10,10 A10,10 0 0,1 10,10 Z" fill="rgba(196,30,58,0.08)" stroke="#C41E3A" strokeWidth="0.55" />
        <path d="M10,10 A10,10 0 0,1 30,10 Z" fill="rgba(196,30,58,0.08)" stroke="#C41E3A" strokeWidth="0.55" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#seigaiha)" />
  </svg>
)

// Fattoush monogram: Islamic 8-pointed star khatam (30×30 tile)
const KHATAM_POINTS = "0,-6 0.96,-2.31 4.24,-4.24 2.31,-0.96 6,0 2.31,0.96 4.24,4.24 0.96,2.31 0,6 -0.96,2.31 -4.24,4.24 -2.31,0.96 -6,0 -2.31,-0.96 -4.24,-4.24 -0.96,-2.31"
const FattoushMonogram = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.09 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <polygon id="khatam" points={KHATAM_POINTS} fill="#C8922A" />
      <pattern id="star-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <use href="#khatam" transform="translate(15,15)" />
        <use href="#khatam" transform="translate(0,0)" />
        <use href="#khatam" transform="translate(30,0)" />
        <use href="#khatam" transform="translate(0,30)" />
        <use href="#khatam" transform="translate(30,30)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#star-grid)" />
  </svg>
)

// Birria monogram: Aztec nested stepped diamonds (24×24 tile)
const BirriasMonogram = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', opacity: 0.092 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="aztec-diamond" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <path
          d="M12,0 L15,0 L15,3 L18,3 L18,6 L21,6 L21,9 L24,9 L24,12 L24,15 L21,15 L21,18 L18,18 L18,21 L15,21 L15,24 L12,24 L9,24 L9,21 L6,21 L6,18 L3,18 L3,15 L0,15 L0,12 L0,9 L3,9 L3,6 L6,6 L6,3 L9,3 L9,0 Z"
          fill="rgba(232,71,10,0.05)" stroke="#C45A0A" strokeWidth="0.55" strokeLinejoin="miter"
        />
        <path
          d="M12,6 L14,6 L14,8 L16,8 L16,10 L18,10 L18,12 L18,14 L16,14 L16,16 L14,16 L14,18 L12,18 L10,18 L10,16 L8,16 L8,14 L6,14 L6,12 L6,10 L8,10 L8,8 L10,8 L10,6 Z"
          fill="rgba(212,134,10,0.04)" stroke="#B85A08" strokeWidth="0.45" strokeLinejoin="miter"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#aztec-diamond)" />
  </svg>
)

// ─── Divider Ornaments ────────────────────────────────────────────────────────

const FleurDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 8px' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(160,100,80,0.4)' }} />
    <svg width="72" height="18" viewBox="0 0 72 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,9 C3,9 5,6 7,9 C9,12 11,12 13,9 C15,6 17,5 19,7 C21,9 22,9 24,9" stroke="rgba(160,100,80,0.52)" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M72,9 C69,9 67,6 65,9 C63,12 61,12 59,9 C57,6 55,5 53,7 C51,9 50,9 48,9" stroke="rgba(160,100,80,0.52)" strokeWidth="0.9" strokeLinecap="round" />
      <g transform="translate(36,9) scale(0.079) translate(-79.5,-93)" fill="rgba(160,100,80,0.75)">
        <path d={FLEUR_PATH} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, background: 'rgba(160,100,80,0.4)' }} />
  </div>
)

const SunMonDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 8px' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(196,30,58,0.3)' }} />
    <svg width="18" height="18" viewBox="-9 -9 18 18" xmlns="http://www.w3.org/2000/svg">
      <circle cx="0" cy="0" r="6" fill="none" stroke="rgba(196,30,58,0.65)" strokeWidth="0.8" />
      <circle cx="0" cy="0" r="3" fill="rgba(196,30,58,0.55)" />
    </svg>
    <div style={{ flex: 1, height: 1, background: 'rgba(196,30,58,0.3)' }} />
  </div>
)

const KhatamDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 8px' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(212,150,42,0.3)' }} />
    <svg width="18" height="18" viewBox="-9 -9 18 18" xmlns="http://www.w3.org/2000/svg">
      <polygon points={KHATAM_POINTS} fill="rgba(212,150,42,0.72)" />
    </svg>
    <div style={{ flex: 1, height: 1, background: 'rgba(212,150,42,0.3)' }} />
  </div>
)

const AztecCrossDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 8px' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(232,71,10,0.32)' }} />
    <svg width="18" height="18" viewBox="-9 -9 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,-6 L1,-6 L1,-3 L3,-1 L6,-1 L6,0 L6,1 L3,1 L1,3 L1,6 L0,6 L-1,6 L-1,3 L-3,1 L-6,1 L-6,0 L-6,-1 L-3,-1 L-1,-3 L-1,-6 Z" fill="rgba(232,71,10,0.72)" />
    </svg>
    <div style={{ flex: 1, height: 1, background: 'rgba(232,71,10,0.32)' }} />
  </div>
)

// ─── Poster Configs ───────────────────────────────────────────────────────────

export const carbonaraPoster: PosterConfig = {
  no: 'No. I',
  layout: 'circle-photo',
  background: '#130c07',
  titleFont: 'playfair',
  textColor: '#E2D4B4',
  accentColor: 'rgba(200,168,110,0.45)',
  runeColor: 'rgba(139,37,19,0.055)',
  rune: 'C',
  provenance: ['Roma · Lazio', 'Repubblica Italiana'],
  recipeName: ['CARBO', 'NARA'],
  subLabel: { text: 'Pasta alla Romana', dataEn: 'Roman-style pasta' },
  description: "The Roman worker's pasta. Four ingredients, no shortcuts. What separates it from everything else isn't the guanciale or the Pecorino — it's knowing when to pull the pan off the heat.",
  ingredients: [
    { text: 'Guanciale stagionato · 200g', dataEn: 'Aged pork cheek · 200g' },
    { text: 'Pecorino Romano DOP · 80g', dataEn: 'Pecorino Romano DOP · 80g' },
    { text: "Tuorli d'uovo · 4", dataEn: 'Egg yolks · 4' },
    { text: 'Spaghetti · 400g', dataEn: null },
    { text: 'Pepe nero macinato', dataEn: 'Freshly ground black pepper' },
  ],
  meta: [
    { label: 'Tempo', labelEn: 'Time', value: '25 min' },
    { label: 'Porzioni', labelEn: 'Servings', value: '4' },
    { label: 'Difficoltà', labelEn: 'Difficulty', value: 'Tecnica' },
  ],
  citation: {
    refText: '† Cultural Note',
    refEn: null,
    body: 'Italians do not use cream in cooking. Not in pasta, not in sauces, not ever. Adding cream to carbonara doesn\'t make it Italian — it makes it something else.',
    source: 'Legge non scritta · Est. ante memoriam',
    sourceEn: 'Unwritten law · Est. before memory',
  },
  imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=500&q=80',
  imageAlt: 'Carbonara',
  monogram: <CarbonaraMonogram />,
  dividerOrnament: null,
  langClass: 'it',
  photoFadeColor: '#130c07',
  borderHoverColor: 'rgba(139,37,19,0.4)',
  washes: 'none',
}

export const ramenPoster: PosterConfig = {
  no: 'No. II',
  layout: 'fullbleed-photo',
  background: '#F0E8D6',
  titleFont: 'dm-serif',
  textColor: '#1A1008',
  accentColor: 'rgba(196,30,58,0.6)',
  provenance: ['日本 · 福岡県', '明治時代より'],
  provenanceEn: ['Japan · Fukuoka Prefecture', 'Since the Meiji era'],
  recipeName: ['Ra-', 'men'],
  subLabel: { text: 'ラーメン · 濃厚スープ', dataEn: 'Wheat noodles · Rich bone broth' },
  description: "In Japan, ramen is not fast food. It is a broth that has been boiling since morning, tended like a fire. You don't order the soup. You enter its argument.",
  ingredients: [
    { text: '豚骨 · 12時間', dataEn: 'Pork bones · 12 hours' },
    { text: '生ラーメン麺', dataEn: 'Fresh wheat noodles' },
    { text: '煮玉子 · 醤油漬け', dataEn: 'Soft-boiled egg · soy-marinated' },
    { text: 'チャーシュー · 海苔 · メンマ', dataEn: 'Chashu pork · nori · bamboo' },
    { text: '醤油たれ · ごま油 · 葱', dataEn: 'Shoyu tare · sesame oil · spring onion' },
  ],
  meta: [
    { label: '作業', labelEn: 'Active', value: '1 h' },
    { label: '出汁', labelEn: 'Broth', value: '12 h' },
    { label: '人前', labelEn: 'Serves', value: '4' },
  ],
  citation: {
    refText: '親方のひと言',
    refEn: "Master's note",
    body: "A proper bowl arrives with heat that holds. Cold ramen is not a bowl. It is a failure of faith.",
    source: '未成文の掟 · どのラーメン屋も · 昭和より',
    sourceEn: 'Unwritten rule · Every ramen shop · Since Showa',
  },
  imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=500&q=80',
  imageAlt: 'Ramen',
  monogram: <RamenMonogram />,
  dividerOrnament: <SunMonDivider />,
  langClass: 'jp',
  photoFadeColor: '#F0E8D6',
  borderHoverColor: 'rgba(196,30,58,0.35)',
  washes: 'radial-gradient(ellipse 55% 40% at 85% 20%, rgba(196,30,58,0.09) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 12% 78%, rgba(44,62,110,0.08) 0%, transparent 55%)',
}

export const croissantPoster: PosterConfig = {
  no: 'No. III',
  layout: 'fullbleed-photo',
  background: '#EFE4CE',
  titleFont: 'dm-serif',
  textColor: '#2E1A0E',
  accentColor: 'rgba(160,100,80,0.65)',
  provenance: ['Paris · Île-de-France', 'Maison fondée 1838'],
  recipeName: ['Crois-', 'sant'],
  subLabel: { text: 'Boulangerie · Viennoiserie', dataEn: 'Pastry shop · Layered pastry' },
  description: "Paris doesn't wake up. It breathes in slowly — coffee, cast iron, the sound of a paper bag. The croissant is not breakfast. It is the reason to get up.",
  ingredients: [
    { text: 'Beurre de qualité · 250g', dataEn: 'Premium unsalted butter · 250g' },
    { text: 'Farine T45 · 500g', dataEn: 'Fine wheat flour · 500g' },
    { text: 'Levure fraîche · 20g', dataEn: 'Fresh yeast · 20g' },
    { text: 'Lait entier · 140ml', dataEn: 'Whole milk · 140ml' },
    { text: 'Sel · Sucre · Dorure', dataEn: 'Salt · Sugar · Egg wash' },
  ],
  meta: [
    { label: 'Actif', labelEn: 'Active time', value: '45 min' },
    { label: 'Repos', labelEn: 'Rest overnight', value: '8 h' },
    { label: 'Cuisson', labelEn: 'Bake', value: '18 min' },
  ],
  citation: {
    refText: 'Note du Boulanger',
    refEn: "Baker's note",
    body: "A proper croissant shatters when you bite it. If it bends, it was made with margarine. The French don't negotiate on butter.",
    source: 'Règle non écrite · Toutes les boulangeries · 1838',
    sourceEn: 'Unwritten rule · Every French bakery · Est. 1838',
  },
  imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80',
  imageAlt: 'Croissant',
  monogram: <CroissantMonogram />,
  dividerOrnament: <FleurDivider />,
  langClass: 'fr',
  photoFadeColor: '#EFE4CE',
  borderHoverColor: 'rgba(180,130,110,0.4)',
  washes: 'radial-gradient(ellipse 70% 50% at 15% 20%, rgba(210,160,148,0.26) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 88% 82%, rgba(148,172,148,0.20) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 10% 85%, rgba(172,158,192,0.16) 0%, transparent 55%)',
}

export const fattoushPoster: PosterConfig = {
  no: 'No. IV',
  layout: 'fullbleed-photo',
  background: '#0E1D35',
  titleFont: 'dm-serif',
  textColor: '#F5EDDB',
  accentColor: 'rgba(212,150,42,0.65)',
  provenance: ['Beirut · بلاد الشام', 'منذ الأزل'],
  provenanceEn: ['Beirut · The Levant', 'Since time immemorial'],
  recipeName: ['Fat-', 'toush'],
  subLabel: { text: 'سلطة الفتوش · السماق ودبس الرمان', dataEn: 'Levantine bread salad · Sumac & pomegranate dressing' },
  description: "In Beirut, lunch arrives with noise. The sumac goes on last, like a signature. Fattoush is not a salad. It is a whole season stacked on a plate.",
  ingredients: [
    { text: 'خبز محمص · مكسّر باليد', dataEn: 'Toasted pita · torn by hand' },
    { text: 'خس · فجل · خيار', dataEn: 'Romaine · radish · cucumber' },
    { text: 'بندورة ناضجة · بصل أخضر', dataEn: 'Ripe tomato · spring onion' },
    { text: 'نعنع طازج · بقلة', dataEn: 'Fresh mint · purslane' },
    { text: 'سماق · دبس الرمان · زيت زيتون', dataEn: 'Sumac · pomegranate molasses · olive oil' },
  ],
  meta: [
    { label: 'تحضير', labelEn: 'Prep', value: '20 min' },
    { label: 'تحميص', labelEn: 'Toast', value: '5 min' },
    { label: 'يكفي', labelEn: 'Serves', value: '4' },
  ],
  citation: {
    refText: 'ملاحظة الجدة',
    refEn: "Grandmother's note",
    body: "Sumac doesn't season food. It argues with it. Throw more than you think you need — then throw more.",
    source: 'كل مطبخ لبناني · منذ الأزل',
    sourceEn: 'Every Lebanese kitchen · Est. indefinitely',
  },
  imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80',
  imageAlt: 'Fattoush',
  monogram: <FattoushMonogram />,
  dividerOrnament: <KhatamDivider />,
  langClass: 'ar',
  photoFadeColor: '#0E1D35',
  borderHoverColor: 'rgba(212,150,42,0.4)',
  washes: 'radial-gradient(ellipse 60% 45% at 18% 22%, rgba(192,57,43,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 88% 78%, rgba(125,155,78,0.09) 0%, transparent 55%)',
}

export const birriasPoster: PosterConfig = {
  no: 'No. V',
  layout: 'fullbleed-photo',
  background: '#130A04',
  titleFont: 'dm-serif',
  textColor: '#F5EDDB',
  accentColor: 'rgba(232,71,10,0.72)',
  provenance: ['Jalisco · México', 'Desde siempre'],
  provenanceEn: ['Jalisco · Mexico', 'Since always'],
  recipeName: ['Birria', 'Tacos'],
  recipeNameFontSize: 'clamp(46px, 9.5vw, 70px)',
  subLabel: { text: 'Tacos de res · consomé', dataEn: 'Braised beef tacos · Bone broth consomé' },
  description: "In Jalisco, birria was cooked in a hole in the ground. The fire went in first, then the meat. What came out eight hours later isn't dinner. It is an event.",
  ingredients: [
    { text: 'Costilla de res · con hueso · 1.5kg', dataEn: 'Beef short rib · bone-in · 1.5kg' },
    { text: 'Chile guajillo · ancho · pasilla', dataEn: 'Guajillo · ancho · pasilla chiles' },
    { text: 'Canela · clavo · orégano mexicano', dataEn: 'Cinnamon · clove · Mexican oregano' },
    { text: 'Tortillas de maíz · cebolla · cilantro', dataEn: 'Corn tortillas · white onion · cilantro' },
    { text: 'Consomé · limón · salsa verde', dataEn: 'Bone broth · lime · salsa verde' },
  ],
  meta: [
    { label: 'Activo', labelEn: 'Active', value: '45 min' },
    { label: 'Brasa', labelEn: 'Braise', value: '8 h' },
    { label: 'Rinde', labelEn: 'Serves', value: '6' },
  ],
  citation: {
    refText: 'Nota del taquero',
    refEn: "Taquero's note",
    body: "You dip the taco in the consomé before you eat it. Anyone who tells you otherwise has never been to Tijuana.",
    source: 'Regla no escrita · Cada taquería · Jalisco',
    sourceEn: 'Unwritten rule · Every taquería · Est. Jalisco',
  },
  imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80',
  imageAlt: 'Birria Tacos',
  monogram: <BirriasMonogram />,
  dividerOrnament: <AztecCrossDivider />,
  langClass: 'es',
  photoFadeColor: '#130A04',
  borderHoverColor: 'rgba(232,71,10,0.4)',
  washes: 'radial-gradient(ellipse 65% 50% at 22% 18%, rgba(232,71,10,0.14) 0%, transparent 58%), radial-gradient(ellipse 50% 45% at 82% 80%, rgba(180,30,10,0.11) 0%, transparent 55%)',
}

export const ALL_POSTERS: PosterConfig[] = [
  carbonaraPoster,
  ramenPoster,
  croissantPoster,
  fattoushPoster,
  birriasPoster,
]
