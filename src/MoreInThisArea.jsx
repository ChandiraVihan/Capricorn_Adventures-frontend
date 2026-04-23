import React, { useEffect, useState } from "react";
import { recommendationService } from "./api/recommendationService";
import "./MoreInThisArea.css";

const MoreInThisArea = ({ adventureId }) => {
  const [adventures, setAdventures] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    load(20);
  }, [adventureId]);

  const load = async (radius) => {
    const data = await recommendationService.getMoreInArea(
      adventureId,
      radius
    );

    if (!data.adventures.length && radius === 20) {
      setExpanded(true);
      load(50); // expand radius
    } else {
      setAdventures(data.adventures.slice(0, 4));
    }
  };

  return (
    <section className="rec-section">
      <h3 className="rec-heading">🌍 More in This Area</h3>

      {expanded && (
        <p className="rec-note">
          No nearby adventures found within 20 km. Showing results within 50 km.
        </p>
      )}

      <div className="rec-grid">
        {adventures.map((adv) => (
          <div key={adv.id} className="rec-card">
            <p className="rec-title">{adv.title}</p>
            <p>{adv.distance} km away</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MoreInThisArea;