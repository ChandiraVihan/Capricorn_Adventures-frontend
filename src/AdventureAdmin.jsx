import { useState, useEffect } from 'react';
import { adventureService } from './api/adventureService';
import './AdventureAdmin.css';

export default function AdventureAdmin() {
  const [adventures, setAdventures] = useState([]);
  const [categories, setCategories] = useState([]);

  // Category creation state
  const [newCategory, setNewCategory] = useState({ name: '', thumbnailUrl: '' });

  // Field names match CreateAdventureRequestDTO exactly
  const EMPTY_ADVENTURE = { name: '', description: '', basePrice: '', categoryId: '', primaryImageUrl: '' };
  const [newAdventure, setNewAdventure] = useState(EMPTY_ADVENTURE);

  const [selectedAdventure, setSelectedAdventure] = useState(null);
  const [schedules, setSchedules] = useState([]);
  // Fields match CreateAdventureScheduleRequestDTO: startDate (ISO datetime), endDate (ISO datetime), availableSlots
  const [newSchedule, setNewSchedule] = useState({ startDate: '', endDate: '', availableSlots: '' });

  const fetchAdventures = async () => {
    try {
      const data = await adventureService.getAllAdventures();
      setAdventures(data);
    } catch (err) {
      alert("Error fetching adventures: " + err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adventureService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err.message);
    }
  };

  useEffect(() => {
    fetchAdventures();
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
        await adventureService.createCategory(newCategory);
        setNewCategory({ name: '', thumbnailUrl: '' });
        fetchCategories(); // Refresh the list for the adventure creation dropdown
        alert("Category created successfully!");
    } catch (err) {
        alert("Error creating category: " + err.message);
    }
  };

  const handleCreateAdventure = async (e) => {
    e.preventDefault();
    try {
      // Send categoryId as a number, basePrice as a number
      await adventureService.createAdventure({
        ...newAdventure,
        categoryId: Number(newAdventure.categoryId),
        basePrice: Number(newAdventure.basePrice),
      });
      setNewAdventure(EMPTY_ADVENTURE);
      fetchAdventures();
    } catch (err) {
      alert("Error creating adventure: " + err.message);
    }
  };

  const handleDeleteAdventure = async (id) => {
    if (window.confirm("Are you sure you want to delete this adventure?")) {
      try {
        await adventureService.deleteAdventure(id);
        fetchAdventures();
        if (selectedAdventure?.id === id) setSelectedAdventure(null);
      } catch (err) {
        alert("Error deleting adventure: " + err.message);
      }
    }
  };

  const handleSelectAdventure = (adventure) => {
    setSelectedAdventure(adventure);
    setSchedules([]);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const created = await adventureService.createSchedule(selectedAdventure.id, {
        ...newSchedule,
        availableSlots: Number(newSchedule.availableSlots),
      });
      setNewSchedule({ startDate: '', endDate: '', availableSlots: '' });
      setSchedules(prev => [...prev, created]);
    } catch (err) {
      alert("Error creating schedule: " + err.message);
    }
  };

  return (
    <div className="admin-container">
      <h2>Adventure Inventory Management</h2>
      <div className="admin-grid">
        <div className="admin-section">
          <h3>Create New Category</h3>
          <p className="helper-text">Add a category before creating adventures.</p>
          <form onSubmit={handleCreateCategory} className="admin-form">
            <input
              type="text" placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              required
            />
            <input
              type="text" placeholder="Thumbnail URL"
              value={newCategory.thumbnailUrl}
              onChange={(e) => setNewCategory({...newCategory, thumbnailUrl: e.target.value})}
              required
            />
            <button type="submit" className="admin-btn">Create Category</button>
          </form>

          <hr className="admin-divider" />

          <h3>Create New Adventure</h3>
          <form onSubmit={handleCreateAdventure} className="admin-form">
            <input
              type="text" placeholder="Name"
              value={newAdventure.name}
              onChange={(e) => setNewAdventure({...newAdventure, name: e.target.value})}
              required
            />
            <textarea
              placeholder="Description"
              value={newAdventure.description}
              onChange={(e) => setNewAdventure({...newAdventure, description: e.target.value})}
            />
            <input
              type="number" placeholder="Base Price" min="0.01" step="0.01"
              value={newAdventure.basePrice}
              onChange={(e) => setNewAdventure({...newAdventure, basePrice: e.target.value})}
              required
            />
            <select
              value={newAdventure.categoryId}
              onChange={(e) => setNewAdventure({...newAdventure, categoryId: e.target.value})}
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text" placeholder="Primary Image URL"
              value={newAdventure.primaryImageUrl}
              onChange={(e) => setNewAdventure({...newAdventure, primaryImageUrl: e.target.value})}
            />
            <button type="submit" className="admin-btn">Create Adventure</button>
          </form>

          <h3>Existing Adventures</h3>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>Base Price</th><th>Actions</th></tr></thead>
            <tbody>
              {adventures.map(adv => (
                <tr key={adv.id} className={selectedAdventure?.id === adv.id ? 'selected' : ''} onClick={() => handleSelectAdventure(adv)}>
                  <td>{adv.name}</td>
                  <td>{adv.categoryName}</td>
                  <td>${adv.basePrice}</td>
                  <td><button onClick={(e) => { e.stopPropagation(); handleDeleteAdventure(adv.id); }} className="delete-btn">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedAdventure && (
          <div className="admin-section">
            <h3>Schedules for: {selectedAdventure.name}</h3>
            <form onSubmit={handleCreateSchedule} className="admin-form">
              <label>Start Date &amp; Time</label>
              <input
                type="datetime-local"
                value={newSchedule.startDate}
                onChange={(e) => setNewSchedule({...newSchedule, startDate: e.target.value})}
                required
              />
              <label>End Date &amp; Time</label>
              <input
                type="datetime-local"
                value={newSchedule.endDate}
                onChange={(e) => setNewSchedule({...newSchedule, endDate: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Available Slots"
                value={newSchedule.availableSlots}
                onChange={(e) => setNewSchedule({...newSchedule, availableSlots: e.target.value})}
                required
              />
              <button type="submit" className="admin-btn">Add Schedule</button>
            </form>

            <table className="admin-table">
              <thead><tr><th>Start</th><th>End</th><th>Available Slots</th><th>Status</th></tr></thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch.id}><td>{sch.startDate}</td><td>{sch.endDate}</td><td>{sch.availableSlots}</td><td>{sch.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

