export function BrandLogo({ descriptor = false }: { descriptor?: boolean }) {
  return <span className="brand-lockup"><span className="brand-symbol" aria-hidden="true"/><span className="brand-type"><span>Brick<b>line</b><i>.</i></span>{descriptor && <small>Real estate intelligence</small>}</span></span>;
}
