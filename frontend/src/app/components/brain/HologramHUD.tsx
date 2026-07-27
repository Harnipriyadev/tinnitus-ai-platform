"use client";

const frequencyBars = [5, 9, 14, 8, 17, 12, 20, 10, 15, 7];
const neuralBars = [8, 15, 11, 24, 18, 29, 17, 25, 13, 21, 10];

export default function HologramHUD() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      aria-hidden="true"
    >
      {/* Connections and tinnitus waveform */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 650 650"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id="waveGradient"
            x1="90"
            y1="0"
            x2="550"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00D7C7" />
            <stop offset="0.5" stopColor="#8FFBFF" />
            <stop offset="1" stopColor="#4F7CFF" />
          </linearGradient>

          <filter
            id="hudGlow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ear-to-brain sound wave */}
        <path
          d="
            M 90 325
            L 115 325
            L 123 309
            L 132 344
            L 142 291
            L 153 358
            L 164 306
            L 174 339
            L 184 318
            L 213 325
            L 235 325
          "
          stroke="url(#waveGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="12 8"
          filter="url(#hudGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="40"
            to="0"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Left hotspot connection */}
        <path
          d="M 242 325 L 195 325"
          stroke="#00D7C7"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.7"
        />

        {/* Auditory cortex connection */}
        <path
          d="M 405 290 L 475 235 L 515 235"
          stroke="#8FFBFF"
          strokeWidth="1.5"
          opacity="0.75"
        />

        {/* Frequency connection */}
        <path
          d="M 418 325 L 515 325"
          stroke="#4F7CFF"
          strokeWidth="1.5"
          opacity="0.75"
        />

        {/* Neural activity connection */}
        <path
          d="M 402 360 L 470 420 L 515 420"
          stroke="#00D7C7"
          strokeWidth="1.5"
          opacity="0.75"
        />
      </svg>

      {/* Holographic ear */}
      <div className="absolute left-[3%] top-1/2 -translate-y-1/2">
        <svg
          width="72"
          height="100"
          viewBox="0 0 72 100"
          fill="none"
          className="drop-shadow-[0_0_12px_rgba(0,215,199,0.9)]"
        >
          <path
            d="
              M48 75
              C45 84 36 91 27 88
              C18 85 14 76 15 66
              C16 56 21 52 23 45
              C25 38 21 33 23 25
              C26 13 38 7 49 12
              C61 17 65 29 61 40
              C58 49 51 52 47 58
              C43 64 44 69 48 75
            "
            stroke="#00D7C7"
            strokeWidth="3"
          />

          <path
            d="
              M47 29
              C39 23 31 29 32 37
              C33 44 41 44 43 50
              C45 57 36 60 34 68
            "
            stroke="#8FFBFF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M34 68 C32 76 38 80 43 76"
            stroke="#4F7CFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <circle cx="47" cy="29" r="3" fill="#E8FFFF">
            <animate
              attributeName="r"
              values="2;4;2"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        <span className="mt-1 block text-center text-[9px] font-semibold tracking-[0.18em] text-[#8FFBFF]/80">
          AUDIO INPUT
        </span>
      </div>

      {/* Left auditory hotspot */}
      <div className="absolute left-[37%] top-[48%]">
        <div className="relative">
          <div className="absolute -inset-3 animate-ping rounded-full bg-[#FFB84D]/30" />
          <div className="h-3 w-3 rounded-full bg-[#FFB84D] shadow-[0_0_18px_6px_#FFB84D]" />
        </div>
      </div>

      {/* Right auditory hotspot */}
      <div className="absolute left-[60%] top-[48%]">
        <div className="relative">
          <div className="absolute -inset-3 animate-ping rounded-full bg-[#FF6B81]/25" />
          <div className="h-3 w-3 rounded-full bg-[#FF6B81] shadow-[0_0_18px_6px_#FF6B81]" />
        </div>
      </div>

      {/* Auditory cortex diagnostic */}
      <div className="absolute right-[1%] top-[27%] w-32 rounded-md border border-[#00D7C7]/70 bg-[#081A2A]/85 px-3 py-2 shadow-[0_0_18px_rgba(0,215,199,0.15)] backdrop-blur-md">
        <p className="text-[9px] tracking-[0.15em] text-[#8FFBFF]">
          DETECTED REGION
        </p>

        <p className="mt-1 text-xs font-bold text-white">
          AUDITORY CORTEX
        </p>

        <div className="mt-2 h-[2px] overflow-hidden bg-[#073A46]">
          <div className="h-full w-[78%] animate-pulse bg-[#00D7C7]" />
        </div>
      </div>

      {/* Frequency diagnostic */}
      <div className="absolute right-[1%] top-[45%] w-32 rounded-md border border-[#4F7CFF]/70 bg-[#081A2A]/85 px-3 py-2 shadow-[0_0_18px_rgba(79,124,255,0.18)] backdrop-blur-md">
        <p className="text-[9px] tracking-[0.15em] text-[#9CB2FF]">
          TINNITUS FREQUENCY
        </p>

        <p className="mt-1 text-lg font-bold text-white">
          8.2
          <span className="ml-1 text-xs text-[#9CB2FF]">
            kHz
          </span>
        </p>

        <div className="mt-1 flex items-end gap-[2px]">
          {frequencyBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1 animate-pulse rounded-sm bg-[#4F7CFF]"
              style={{
                height: `${height}px`,
                animationDelay: `${index * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Neural activity diagnostic */}
      <div className="absolute right-[1%] top-[64%] w-32 rounded-md border border-[#00D7C7]/70 bg-[#081A2A]/85 px-3 py-2 shadow-[0_0_18px_rgba(0,215,199,0.15)] backdrop-blur-md">
        <p className="text-[9px] tracking-[0.15em] text-[#8FFBFF]">
          NEURAL ACTIVITY
        </p>

        <div className="mt-2 flex h-8 items-end gap-[3px]">
          {neuralBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1.5 animate-pulse rounded-t-sm bg-[#00D7C7]"
              style={{
                height: `${height}px`,
                animationDelay: `${index * 80}ms`,
              }}
            />
          ))}
        </div>

        <p className="mt-1 text-[9px] text-[#8FFBFF]/60">
          LIVE SIGNAL
        </p>
      </div>
    </div>
  );
}