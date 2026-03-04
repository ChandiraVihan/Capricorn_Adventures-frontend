import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './HotelLanding.css';

const HotelLanding = () => {
  const [images, setImages] = useState([
    { id: 1, src: "src/assets/700644344.jpg" },
    { id: 2, src: "src/assets/754840632.jpg" },
    { id: 3, src: "src/assets/bar.jpg" },
    { id: 4, src: "src/assets/754838806.jpg" },
    { id: 5, src: "src/assets/700644293.jpg" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setImages((prev) => {
        const newArray = [...prev];
        const lastItem = newArray.pop();
        newArray.unshift(lastItem); // Rotates the images
        return newArray;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hotel-carousel-wrapper">
      <div className="hotel-text-header">
        <h1>We Promise Service that Leaves</h1>
        <h1>Nothing to Ask for</h1>
      </div>

      <div className="carousel-container">
        {images.map((img, index) => {
          // Determine the visual state based on position in array
          let positionClass = "side-small";
          if (index === 1 || index === 3) positionClass = "side-medium";
          if (index === 2) positionClass = "center-large";

          return (
            <motion.div
              layout
              key={img.id}
              transition={{
                layout: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.4 }
              }}
              className={`carousel-card ${positionClass}`}
            >
              <motion.img
                layout="position"
                src={img.src}
                alt="Resort"
              />
              {index === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="label-overlay">
                  {img.label}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default HotelLanding;
