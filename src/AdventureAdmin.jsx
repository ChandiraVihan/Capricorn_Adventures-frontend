import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { adventureService } from './api/adventureService';
import './AdventureAdmin.css';

export default function AdventureAdmin() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [adventures, setAdventures] = useState([]);
  const [categories, setCategories] = useState([]);

  // Category creation state
  const [newCategory, setNewCategory] = useState({ name: '', thumbnailUrl: '' });

  // Field names match CreateAdventureRequestDTO exactly
  const EMPTY_ADVENTURE = { 
    name: '', 
    description: '', 
    basePrice: '', 
    categoryId: '', 
    primaryImageUrl: '',
    location: '',
    difficultyLevel: 'Moderate',
    minAge: '',
    itinerary: '',
    inclusions: '',
    // Initial Schedule fields (not part of CreateAdventureRequestDTO, but used for immediate follow-up)
    scheduleStartDate: '',
    scheduleEndDate: '',
    scheduleSlots: '10'
  };
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

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const handleBackToSite = () => {
    navigate('/home');
  };

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
      // 1. Create the Adventure
      const createdAdventure = await adventureService.createAdventure({
        name: newAdventure.name,
        description: newAdventure.description,
        basePrice: Number(newAdventure.basePrice),
        categoryId: Number(newAdventure.categoryId),
        primaryImageUrl: newAdventure.primaryImageUrl,
        location: newAdventure.location,
        difficultyLevel: newAdventure.difficultyLevel,
        minAge: newAdventure.minAge ? Number(newAdventure.minAge) : null,
        itinerary: newAdventure.itinerary,
        inclusions: newAdventure.inclusions
      });

      // 2. Automatically create the initial schedule so it shows up in /adventures
      if (newAdventure.scheduleStartDate && newAdventure.scheduleEndDate) {
        await adventureService.createSchedule(createdAdventure.id, {
          startDate: newAdventure.scheduleStartDate,
          endDate: newAdventure.scheduleEndDate,
          availableSlots: Number(newAdventure.scheduleSlots),
          status: 'AVAILABLE'
        });
      }

      setNewAdventure(EMPTY_ADVENTURE);
      fetchAdventures();
      alert("Adventure and initial schedule created successfully!");
    } catch (err) {
      alert("Error creating adventure/schedule: " + err.message);
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

  const totalSchedules = schedules.length;

  return (
    <div className="adventure-admin-shell">
      <aside className="adventure-admin-sidebar">
        <div className="adventure-sidebar-brand">
          <span className="adventure-brand-mark">CA</span>
          <div>
            <h2>Capricorn</h2>
            <p>Adventure Control</p>
          </div>
        </div>

        <nav className="adventure-sidebar-nav" aria-label="Admin quick sections">
          <button type="button" className="adventure-nav-item is-active">Inventory</button>
          <button type="button" className="adventure-nav-item">Categories</button>
          <button type="button" className="adventure-nav-item">Schedules</button>
        </nav>

        <section className="adventure-sidebar-card">
          <p>Adventures</p>
          <strong>{adventures.length}</strong>
          <small>Total available in system</small>
        </section>

        <section className="adventure-sidebar-card">
          <p>Categories</p>
          <strong>{categories.length}</strong>
          <small>Configured taxonomy entries</small>
        </section>

        <section className="adventure-sidebar-card">
          <p>Selected Schedules</p>
          <strong>{selectedAdventure ? totalSchedules : 0}</strong>
          <small>{selectedAdventure ? `For ${selectedAdventure.name}` : 'Select an adventure to inspect'}</small>
        </section>

        <div className="adventure-sidebar-actions">
          <button onClick={handleBackToSite} className="admin-btn secondary">Back to Website</button>
          <button onClick={handleLogout} className="admin-btn logout">Log Out</button>
        </div>
      </aside>

      <main className="admin-container">
        <header className="admin-header">
          <div className="admin-header-left">
            <h2>Adventure Inventory Management</h2>
            <p>Create categories, launch adventures, and manage schedule availability from one board.</p>
          </div>
        </header>
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
              <input
                type="text" placeholder="Location (e.g. Mirissa, Yala)"
                value={newAdventure.location}
                onChange={(e) => setNewAdventure({...newAdventure, location: e.target.value})}
              />
              <select
                value={newAdventure.difficultyLevel}
                onChange={(e) => setNewAdventure({...newAdventure, difficultyLevel: e.target.value})}
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
              <input
                type="number" placeholder="Minimum Age"
                value={newAdventure.minAge}
                onChange={(e) => setNewAdventure({...newAdventure, minAge: e.target.value})}
              />
              <textarea
                placeholder="Itinerary (optional)"
                value={newAdventure.itinerary}
                onChange={(e) => setNewAdventure({...newAdventure, itinerary: e.target.value})}
              />
              <textarea
                placeholder="Inclusions (optional)"
                value={newAdventure.inclusions}
                onChange={(e) => setNewAdventure({...newAdventure, inclusions: e.target.value})}
              />

              <div className="admin-sub-section">
                <h4>Initial Available Schedule</h4>
                <p className="helper-text">Required for the adventure to be visible on the public page.</p>
                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={newAdventure.scheduleStartDate}
                  onChange={(e) => setNewAdventure({...newAdventure, scheduleStartDate: e.target.value})}
                  required
                />
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={newAdventure.scheduleEndDate}
                  onChange={(e) => setNewAdventure({...newAdventure, scheduleEndDate: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Initial Available Slots"
                  value={newAdventure.scheduleSlots}
                  onChange={(e) => setNewAdventure({...newAdventure, scheduleSlots: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="admin-btn">Create Adventure</button>
            </form>
          </div>

          <div className="admin-section-group">
            <div className="admin-section">
              <h3>Existing Adventures</h3>
              <div className="admin-table-container">
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
            </div>

            {selectedAdventure && (
              <div className="admin-section admin-schedule-panel">
                <h3>Schedules for: {selectedAdventure.name}</h3>
                <form onSubmit={handleCreateSchedule} className="admin-form">
                  <div className="form-field">
                    <label>Start Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.startDate}
                      onChange={(e) => setNewSchedule({...newSchedule, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>End Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={newSchedule.endDate}
                      onChange={(e) => setNewSchedule({...newSchedule, endDate: e.target.value})}
                      required
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Available Slots"
                    value={newSchedule.availableSlots}
                    onChange={(e) => setNewSchedule({...newSchedule, availableSlots: e.target.value})}
                    required
                  />
                  <button type="submit" className="admin-btn">Add Schedule</button>
                </form>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead><tr><th>Start</th><th>End</th><th>Available Slots</th><th>Status</th></tr></thead>
                    <tbody>
                      {schedules.map(sch => (
                        <tr key={sch.id}><td>{sch.startDate}</td><td>{sch.endDate}</td><td>{sch.availableSlots}</td><td>{sch.status}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
