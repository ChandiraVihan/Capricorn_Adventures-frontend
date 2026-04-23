import React, { useState } from "react";
import "./CarRental.css";
import { carRentalService } from "./api/carRentalService";
import { useNavigate } from "react-router-dom";

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const CarRental = ({ adventureLocation }) => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("Economy");
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await carRentalService.searchCars(
        adventureLocation,
        startDate,
        endDate,
        category
      );

      const allCars = data?.cars || [];

      const filteredCars = allCars.filter(
        (car) => car.category === category
      );

      setCars(filteredCars);
    } catch {
      setError("Rental service unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (car) => {
    setSelectedCar(car);
  };

  const handleAddToBooking = () => {
    if (!selectedCar) return;

    const query = new URLSearchParams({
      carId: selectedCar.id,
      carName: selectedCar.name,
      carPrice: selectedCar.price,
      pickupLocation: adventureLocation,
      startDate,
      endDate,
    }).toString();

    navigate(`/adventures/checkout?${query}`);
  };

  return (
    <section className="cr-section">
      <div className="cr-header">
        <div className="cr-title-row">
          <span className="cr-icon">🚗</span>
          <div>
            <h2 className="cr-heading">Car Rentals</h2>
            <p className="cr-sub">Find transport near your adventure</p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="cr-form">
        <input className="cr-input" value={adventureLocation} readOnly />

        <select
          className="cr-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Economy</option>
          <option>SUV</option>
          <option>Luxury</option>
        </select>

        <input type="date" className="cr-input" onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="cr-input" onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <button className="cr-btn" onClick={handleSearch}>
        🔍 Search Cars
      </button>

      {/* LOADING */}
      {loading && <div className="cr-loading">Loading vehicles...</div>}

      {/* ERROR */}
      {error && (
        <div className="cr-error">
          Rental unavailable.{" "}
          <a href="https://partnercars.com" target="_blank" rel="noreferrer">
            Book via partner
          </a>
        </div>
      )}

      {/* RESULTS */}
      <div className="cr-grid">
        {cars.map((car, idx) => (
          <div
            key={car.id}
            className={`cr-card ${selectedCar?.id === car.id ? "cr-card--selected" : ""}`}
            style={{ animationDelay: `${idx * 50}ms` }}
            onClick={() => handleSelect(car)}
          >
            <div>
              <p className="cr-name">{car.name}</p>
              <p className="cr-cat">{car.category}</p>
              <p className="cr-price">{formatLkr(car.price)} / day</p>
            </div>

            <button className="cr-add-btn">
              {selectedCar?.id === car.id ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>

      {/* ADD TO BOOKING */}
      {selectedCar && (
        <div className="cr-selected-box">
          <p>Selected: <b>{selectedCar.name}</b></p>
          <button className="cr-confirm-btn" onClick={handleAddToBooking}>
            Add to Booking →
          </button>
        </div>
      )}
    </section>
  );
};

export default CarRental;