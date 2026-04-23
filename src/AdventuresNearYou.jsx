import React, { useEffect, useState } from "react";
import { recommendationService } from "./api/recommendationService";
import "./MoreInThisArea.css";

const AdventuresNearYou = () => {
  const [adventures, setAdventures] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        loadData(coords);
      },
      () => {
        const fallback = { lat: 6.9271, lng: 79.8612 };
        setLocation(fallback);
        loadData(fallback);
      }
    );
  }, []);

  const loadData = async (coords) => {
    const data = await recommendationService.getNearbyAdventures(
      coords.lat,
      coords.lng
    );

    setAdventures(data?.adventures?.slice(0, 6) || []);
  };

  return (
    <section className="rec-section">
      <h2 className="rec-heading">📍 Adventures Near You</h2>

      <div className="rec-grid">
        {adventures.map((adv) => (
          <div key={adv.id} className="rec-card">
            <p className="rec-title">{adv.title}</p>
            <p>{adv.distance} km away</p>
            <p>⭐ {adv.rating}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdventuresNearYou;