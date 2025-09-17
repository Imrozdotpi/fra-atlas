// components/hexagon-grid.tsx
"use client";

interface HexagonGridProps {
  className?: string;
}

const hexClip =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export default function HexagonGrid({ className = "" }: HexagonGridProps) {
  // Local images in public/images/hex/hex1.jpg ... hex7.jpg
  const hexagonImages = [
    { src: "/images/hex/hex1.jpg", alt: "Community meeting in forest" },
    { src: "/images/hex/hex2.jpg", alt: "Smiling farmer woman" },
    { src: "/images/hex/hex3.jpg", alt: "Carrying forest produce" },
    { src: "/images/hex/hex4.jpg", alt: "Center hex - procession" },
    { src: "/images/hex/hex5.jpg", alt: "Woman carrying wood" },
    { src: "/images/hex/hex6.jpg", alt: "Traditional dance / culture" },
    { src: "/images/hex/hex7.jpg", alt: "Farmer smiling in field" },
  ];

  // honeycomb pattern: 3 - 1 - 3
  const rows: { src: string; alt: string }[][] = [
    [hexagonImages[0], hexagonImages[1], hexagonImages[2]], // top row
    [hexagonImages[3]], // middle row
    [hexagonImages[4], hexagonImages[5], hexagonImages[6]], // bottom row
  ];

  // ------------------------------
  // Hexagon sizing + overlap math
  const hexSize = 80; // base size (mobile)
  const overlapAmount = Math.round(hexSize * 0.15); // row overlap
  // ------------------------------

  // ------------------------------
  // Per-image offsets
  // Index order matches hexagonImages array (0–6)
  // Adjust these numbers to move individual images
  // Negative = up/left, Positive = down/right
  const imageOffsetsY = [-20, -2, -20, -6, 0, -22, 0]; // up/down
  const imageOffsetsX = [21, 5, -11, 5, 21, 5, -11];    // left/right
  // ------------------------------

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      style={{ marginLeft: "-160px" }}
    >
      {rows.map((row, rIdx) => {
        const isCenterRow = rIdx === 1;

        const computedStyle: React.CSSProperties = {
          marginBottom:
            rIdx === rows.length - 1 ? 0 : rIdx === 0 ? -overlapAmount : 0,
          marginTop: isCenterRow ? 0 : 0,
        };

        return (
          <div
            key={rIdx}
            className={`flex items-center ${isCenterRow ? "justify-center" : ""}`}
            style={computedStyle}
          >
            {row.map((img, i) => {
              // compute the absolute index in hexagonImages
              const globalIndex =
                rIdx === 0
                  ? i
                  : rIdx === 1
                  ? 3 // middle row always index 3
                  : 4 + i; // bottom row indexes 4–6

              return (
                <div
                  key={globalIndex}
                  role="img"
                  aria-label={img.alt}
                  className="relative overflow-hidden m-2 transition-transform"
                  style={{
                    width: hexSize,
                    height: hexSize,
                    clipPath: hexClip,
                    WebkitClipPath: hexClip,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                    transform: `translate(${imageOffsetsX[globalIndex]}px, ${imageOffsetsY[globalIndex]}px)`,
                  }}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out"
                    style={{ transformOrigin: "center" }}
                  />

                  {/* white border inside the hexagon */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      boxSizing: "border-box",
                      border: "4px solid rgba(255,255,255,0.95)",
                      clipPath: hexClip,
                      WebkitClipPath: hexClip,
                    }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      <style jsx>{`
        /* hover zoom */
        div[role="img"]:hover img {
          transform: scale(1.08);
        }

        /* responsive sizes */
        @media (min-width: 640px) {
          div[role="img"] {
            width: 90px !important;
            height: 90px !important;
          }
        }
        @media (min-width: 768px) {
          div[role="img"] {
            width: 110px !important;
            height: 110px !important;
          }
        }
        @media (min-width: 1024px) {
          div[role="img"] {
            width: 130px !important;
            height: 130px !important;
          }
        }
      `}</style>
    </div>
  );
} 