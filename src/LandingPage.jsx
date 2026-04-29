import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPage.css';
import Bar from './assets/bar.jpg';
import video from './assets/custom.mp4';
import AdventuresNearYou from './AdventuresNearYou';
import hero from './assets/hero.png';
import roll from './assets/roll.jpg';
import mat from './assets/mat.jpg';
import bed from './assets/bed.jpg';

gsap.registerPlugin(ScrollTrigger);

const testimonialsData = [
  { text: "AN ABSOLUTE MASTERCLASS IN LUXURY REAL ESTATE. THE SEAMLESS INTEGRATION OF MODERN DESIGN AND NATURE IS BREATHTAKING.", author: "ARCHITECTURAL DIGEST" },
  { text: "REDEFINING MODERN LIVING WITH A BOLD BRUTALIST EDGE. COLOMBO WATER FRONT IS THE NEW STANDARD OF LUXURY.", author: "DESIGN MILK" },
  { text: "THE MOST EXCLUSIVE PROPERTIES IN THE HEART OF COLOMBO. UNMATCHED ATTENTION TO DETAIL AND CRAFTSMANSHIP.", author: "VOGUE LIVING" },
];

export default function LandingPage() {
  const containerRef = useRef(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  const images = [
    "https://images.unsplash.com/photo-1486406",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600&h=800",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=600&h=800"
  ];

  // Testimonial Carousel Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialsData.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      
      // 1. HERO ANIMATION
      const tl = gsap.timeline();
      tl.from(".hero-video-container", {
        scale: 1.2,
        opacity: 0,
        duration: 2.5,
        ease: "power4.out",
      })
      .from(".hero-title-line", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out"
      }, "-=1.8")
      .from(".hero-main-desc", {
        x: -30,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      }, "-=1")
      .from(".vertical-text", {
        height: 0,
        opacity: 0,
        duration: 1.5,
        ease: "power3.inOut"
      }, "-=1.5");

      // 4. GALLERY "PAGE FLIP" EFFECT
      gsap.from(".gallery-item", {
        y: 100,
        z: 100,
        rotationY: (index) => (index % 2 === 0 ? 5 : -5),
        opacity: 0,
        duration: 1.5,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".gallery-section",
          start: "top 65%",
        }
      });

      gsap.from(".about-manga-image", {
        scale: 0.9,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".about-manga-section",
          start: "top 70%",
        }
      });

      // 3. TESTIMONIAL ANIMATION
      gsap.fromTo(".testimonial-text, .testimonial-author", 
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 1, ease: "power2.out" }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [currentTestimonial]);

  return (
    <div ref={containerRef} className="landing-page-wrapper">
      <div className="manga-noise"></div>

      {/* HERO SECTION */}
      <header className="hero-manga-grid">
        <div className="vertical-text">ESTABLISHED 2026 ✦ NO COMPROMISE</div>
        
        <div className="hero-text-panel">
          <h1 className="hero-main-title">
            <div className="hero-title-line">DISCOVER</div>
            <div className="hero-title-line">YOUR DREAM</div>
            <div className="hero-title-line">LUXURY HOME</div>
          </h1>
          <p className="hero-main-desc">
            EXPLORE THE MOST EXCLUSIVE PROPERTIES IN PRIME LOCATIONS. 
            FROM STUNNING PENTHOUSES TO SPRAWLING ESTATES. 
            REDEFINING MODERN LIVING IN COLOMBO.
          </p>
          <div className="hero-btns">
            <Link to="/search" className="brutal-btn-primary" style={{ textDecoration: 'none' }}>
              VIEW PROPERTIES
            </Link>
            <Link to="/adventures" className="brutal-btn-secondary" style={{ textDecoration: 'none' }}>
              VIEW ADVENTURES
            </Link>
          </div>
        </div>
        
        <div className="hero-video-panel">
          <div className="hero-video-container">
            <video autoPlay loop muted playsInline>
              <source src={video} type="video/mp4" />
            </video>
            <div className="hero-video-overlay"></div>
          </div>
          <div className="hero-caption">
            THE VILLA ✦ PHASE I
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="manga-marquee">
        <div className="manga-marquee-content">
          <span>DISCOVER YOUR DREAM LUXURY HOME ✦ ADVENTURES AWAIT ✦ THE NEW STANDARD ✦ </span>
          <span>DISCOVER YOUR DREAM LUXURY HOME ✦ ADVENTURES AWAIT ✦ THE NEW STANDARD ✦ </span>
        </div>
      </div>

      {/* ADVENTURES SECTION */}
      <section className="adventures-manga-section" id="adventures">
        <div className="adventures-header">
          <h2 className="adventures-title">ADVENTURES.</h2>
          <div className="vertical-text">NEAR YOU</div>
        </div>
        <div style={{ padding: '2rem' }}>
          <AdventuresNearYou />
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery-section">
        <h2 className="section-title text-right">GALLERY.</h2>
        <div className="gallery-grid perspective-box">
          <div className="gallery-item large"><img src={Bar} alt="Interior" className="retro-filter" /></div>
          <div className="gallery-item"><img src={mat} alt="Building" className="retro-filter" /></div>
          <div className="gallery-item"><img src={roll} alt="Villa" className="retro-filter" /></div>
          <div className="gallery-item large"><img src={bed} alt="Pool" className="retro-filter" /></div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-manga-section" id="about">
        <div className="about-manga-text">
          <h2>ABOUT COLOMBO WATER FRONT</h2>
          <p>
            WITH OVER 25 YEARS OF EXPERTISE IN LUXURY REAL ESTATE, WE HAVE ESTABLISHED OURSELVES AS THE LEADING AUTHORITY IN HIGH-END PROPERTY SALES AND ACQUISITIONS. OUR DEDICATED TEAM COMBINES MARKET KNOWLEDGE, INDUSTRY CONNECTIONS, AND PERSONALIZED SERVICE TO DELIVER EXCEPTIONAL RESULTS FOR OUR CLIENTS.
          </p>
          <Link to="/search" className="brutal-btn-primary" style={{ marginTop: '3rem', textDecoration: 'none', display: 'inline-block' }}>
            LEARN MORE
          </Link>
        </div>
        <div className="about-manga-image">
          <img src={hero} alt="About Us" />
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials-manga-section">
        <div className="testimonial-panel">
          <div className="testimonial-label">WHAT THEY SAY</div>
          <h2 className="testimonial-text">
            "{testimonialsData[currentTestimonial].text}"
          </h2>
          <div className="testimonial-author">— {testimonialsData[currentTestimonial].author}</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="manga-footer">
        <div className="footer-main">
          <div className="footer-col">
            <h2>COLOMBO<br/>WATER FRONT.</h2>
          </div>
          <div className="footer-col">
            <div className="footer-links-list">
              <Link to="/search">PROPERTIES</Link>
              <Link to="/adventures">ADVENTURES</Link>
              <Link to="/find-booking">CONTACT</Link>
            </div>
          </div>
          <div className="footer-col">
            <p>74/1 Kahatagahawatte Road
<br/>10290 Boralesgamuwa<br/>SRI LANKA</p>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span>© 2026 COLOMBO WATER FRONT</span>
          <span>All Rights Reserved .</span>
        </div>
      </footer>
    </div>
  );
}