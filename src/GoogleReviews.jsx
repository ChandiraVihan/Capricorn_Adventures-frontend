import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

// Mock data for development - replace with API call later
const MOCK_REVIEWS = [
  {
    id: 1,
    author_name: "HIDETOSHI NAKATA",
    rating: 5,
    relative_time_description: "2 WEEKS AGO",
    text: "THE ARCHITECTURE IS UNLIKE ANYTHING ELSE IN COLOMBO. A BOLD STATEMENT OF MODERN LUXURY. THE ADVENTURE TOURS ARE PROFESSIONALLY HANDLED.",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hidetoshi"
  },
  {
    id: 2,
    author_name: "SARAH JENKINS",
    rating: 5,
    relative_time_description: "1 MONTH AGO",
    text: "REDEFINING THE STAYCATION. THE SEAMLESS BLEND OF BRUTALIST DESIGN AND COMFORT IS MASTERFUL. HIGHLY RECOMMEND THE ELLA SUMMIT TRAIL.",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    id: 3,
    author_name: "MARCO ROSSI",
    rating: 4,
    relative_time_description: "3 DAYS AGO",
    text: "STUNNING VISUALS AND TOP-TIER SERVICE. THE PROPERTIES ARE EVEN MORE IMPRESSIVE IN PERSON. A TRULY UNIQUE EXPERIENCE IN SRI LANKA.",
    profile_photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marco"
  }
];

export default function GoogleReviews({ placeId, apiKey }) {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Note: Fetching directly from Google Places API in the browser usually hits CORS issues.
    // Recommended: Fetch via your backend or use the Google Maps JS SDK.
  }, [placeId, apiKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (loading) return <div className="testimonial-panel">LOADING REVIEWS...</div>;

  const current = reviews[index];

  return (
    <div className="testimonial-panel">
      <div className="testimonial-label">GOOGLE REVIEWS ✦ WHAT THEY SAY</div>
      
      <div className="review-meta">
        <div className="review-stars">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={18} 
              fill={i < current.rating ? "var(--black)" : "none"} 
              stroke="var(--black)"
              strokeWidth={3}
            />
          ))}
        </div>
        <span className="review-date">{current.relative_time_description}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="review-content"
        >
          <h2 className="testimonial-text">
            "{current.text}"
          </h2>
          
          <div className="testimonial-author-wrapper">
            <img 
              src={current.profile_photo_url} 
              alt={current.author_name} 
              className="reviewer-avatar"
            />
            <div className="testimonial-author-info">
              <div className="testimonial-author">{current.author_name}</div>
              <div className="verified-badge">VERIFIED GUEST</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="review-navigation">
        {reviews.map((_, i) => (
          <button 
            key={i}
            onClick={() => setIndex(i)}
            className={`nav-dot ${i === index ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
