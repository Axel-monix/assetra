export default function BrandLogo({ className = "" }) {
  return (
    <span className={`assetra-brand-logo ${className}`.trim()}>
      <img src="/assetra-logo.svg" alt="" aria-hidden="true" />
      <span>Assetra</span>
    </span>
  );
}
