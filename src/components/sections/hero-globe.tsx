/**
 * Globe wireframe: mengutip bola dunia di logo Every Nation. Garis lintang dan
 * bujurnya dihitung sebagai bola sungguhan (rx lintang = sqrt(R^2 - dy^2)), jadi
 * bentuknya benar, bukan ellipse yang ditebak. Dipakai sebagai latar hero: satu
 * dunia, satu keluarga. Murni dekoratif, jadi aria-hidden.
 */
export function HeroGlobe({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="200" cy="200" r="180" strokeOpacity="0.5" />
      <g strokeOpacity="0.28">
      <ellipse cx="200" cy="74" rx="128.5" ry="21.2" />
      <ellipse cx="200" cy="134" rx="167.5" ry="27.6" />
      <ellipse cx="200" cy="200" rx="180.0" ry="29.7" />
      <ellipse cx="200" cy="266" rx="167.5" ry="27.6" />
      <ellipse cx="200" cy="326" rx="128.5" ry="21.2" />
      </g>
      <g strokeOpacity="0.22">
      <ellipse cx="200" cy="200" rx="180" ry="180" />
      <ellipse cx="200" cy="200" rx="139" ry="180" />
      <ellipse cx="200" cy="200" rx="92" ry="180" />
      <ellipse cx="200" cy="200" rx="36" ry="180" />
      </g>
      <g fill="currentColor" stroke="none" fillOpacity="0.55">
    <circle cx="107.9" cy="134.0" r="3.2" />
    <circle cx="329.6" cy="200.0" r="3.2" />
    <circle cx="69.4" cy="266.0" r="3.2" />
    <circle cx="257.8" cy="326.0" r="3.2" />
    <circle cx="238.6" cy="74.0" r="3.2" />
      </g>
    </svg>
  );
}
