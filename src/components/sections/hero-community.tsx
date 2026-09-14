import { Parallax } from "../parallax";

// Authentic ENKG moments from “7 Years of Caleidoscope”, linked from the
// church's Linktree. SVG viewports reuse the original photo without enlarging
// the full montage or showing its overlaid video title. See resources/README.md.
const moments = [
  { name: "fellowship", frame: "130 65 400 172" },
  { name: "children", frame: "234 490 414 230" },
  { name: "friends", frame: "538 0 395 190" },
  { name: "life-group", frame: "695 492 413 228" },
  { name: "community", frame: "863 136 410 188" },
  { name: "celebration", frame: "1027 419 253 157" },
] as const;

export function HeroCommunity() {
  return (
    <div className="hero-community" aria-hidden="true">
      <Parallax speed={-3} className="hero-community-motion">
        <div className="hero-community-grid">
          {moments.map((moment) => (
            <div key={moment.name} className={`hero-community-photo hero-community-${moment.name}`}>
              <svg viewBox={moment.frame} preserveAspectRatio="xMidYMid slice" focusable="false">
                <image href="/images/photos/community-collage.jpg" width="1280" height="720" />
              </svg>
            </div>
          ))}
        </div>
      </Parallax>
      <p className="hero-community-caption font-serif italic text-cream-100/80">
        Saling mengenal. Saling menguatkan.
      </p>
    </div>
  );
}
