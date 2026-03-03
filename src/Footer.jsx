import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      {/* Decorative arc */}
      <svg className="footer__arc" viewBox="0 0 100 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M90 20 Q-20 210 90 400" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />
      </svg>

      {/* ── HERO ROW ── */}
      <div className="footer__hero">
        <div className="footer__hero-left">
          <div className="footer__block footer__block--word footer__block--w1" />
          <div className="footer__block footer__block--word footer__block--w2" />
        </div>

        <div className="footer__plus">
          <div className="footer__plus-h" />
          <div className="footer__plus-v" />
        </div>

        <div className="footer__hero-right">
          <div className="footer__block footer__block--word footer__block--w3" />
          <div className="footer__block footer__block--word footer__block--w4" />
        </div>
      </div>

      {/* ── BRAND + NAV ROW ── */}
      <div className="footer__mid">
        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__brand-logo">
            <div className="footer__logo-icon" />
            <div className="footer__logo-sep" />
            <div className="footer__logo-text">
              <div className="footer__block footer__block--brand-name" />
              <div className="footer__block footer__block--brand-sub" />
            </div>
          </div>
          <div className="footer__brand-desc">
            <div className="footer__block footer__block--desc footer__block--desc-1" />
            <div className="footer__block footer__block--desc footer__block--desc-2" />
            <div className="footer__block footer__block--desc footer__block--desc-3" />
          </div>
        </div>

        {/* Nav columns */}
        <div className="footer__nav">
          {[
            { header: 60, links: [90, 55, 75] },
            { header: 65, links: [50, 65, 45, 55, 60] },
            { header: 60, links: [80] },
            { header: 75, links: [120] },
          ].map((col, ci) => (
            <div className="footer__nav-col" key={ci}>
              <div className="footer__block footer__block--nav-header" style={{ width: col.header }} />
              {col.links.map((w, li) => (
                <div className="footer__block footer__block--nav-link" style={{ width: w }} key={li} />
              ))}
            </div>
          ))}
        </div>

        {/* Social icons */}
        <div className="footer__social">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="footer__social-icon" key={i} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="footer__bottom">
        <div className="footer__bottom-left">
          <div className="footer__cert-badge" />
          <div className="footer__cert-text">
            <div className="footer__block footer__block--cert-a" />
            <div className="footer__block footer__block--cert-b" />
          </div>
        </div>
        <div className="footer__block footer__block--copy" />

        {/* START NOW — lives inside bottom bar, flush to right edge */}
        <button className="footer__start-now">Start Now</button>
      </div>
    </footer>
  );
}