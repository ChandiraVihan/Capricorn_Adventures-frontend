import React from 'react';
import './LandingPage.css';

export default function LandingPage() {
  const images = [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=500", // Modern Building
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400&h=500", // Villa
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=400&h=500", // Pool
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400&h=500", // Estate
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=400&h=500"  // Interior
  ];

  return (
    <div className="landing-page-container">
      <div className="hero-section">
        <div className="hero-content">
          {/* <div className="badge">
            <span className="icon">♕</span> Premium Properties
          </div> */}
          
          <h1 className="title">Discover Your Dream Luxury Home</h1>
          
          <p className="description">
            Explore the most exclusive properties in prime locations. From stunning penthouses to sprawling estates, we showcase the finest luxury real estate curated for discerning buyers.
          </p>
          
          <div className="button-group">
            <button className="btn btn-primary">View Properties</button>
            <button className="btn btn-secondary">Schedule Consultation</button>
          </div>
        </div>

        <div className="gallery-container">
          {images.map((src, index) => (
            <div key={index} className="gallery-card">
              <img src={src} alt={`Property view ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <section className="about-section">
        <div className="about-bg-overlay"></div>
        <div className="about-content">
          <h2 className="about-title">About Colombo Water Front</h2>
          <p className="about-description">
            With over 25 years of expertise in luxury real estate, we have established ourselves as the leading authority in high-end property sales and acquisitions. Our dedicated team combines market knowledge, industry connections, and personalized service to deliver exceptional results for our clients.
          </p>
          <button className="btn btn-primary about-btn">Learn More</button>
        </div>
      </section>
    </div>
  );
}