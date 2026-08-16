import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import {
  Film,
  Tv,
  Plus,
  LogOut,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Search,
  Eye,
  RotateCcw,
  User,
  Sparkles,
  Loader2
} from 'lucide-react';

const Watchlist = () => {
  const { user, logout } = useAuth();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state: 'Unwatched' | 'Watched'
  const [activeTab, setActiveTab] = useState('Unwatched');
  
  // Search query filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Movie');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial media list
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('media/');
      setMediaList(response.data);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Failed to load watchlist items. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new media
  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        type: newType,
        status: 'Unwatched',
        rating: 0,
      };
      const response = await api.post('media/', payload);
      setMediaList((prev) => [response.data, ...prev]);
      setNewTitle('');
      setNewType('Movie');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding media:', err);
      alert('Failed to add media item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status ('Unwatched' <-> 'Watched')
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Watched' ? 'Unwatched' : 'Watched';
    // Optimistic UI update
    setMediaList((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, status: nextStatus } : m))
    );

    try {
      await api.patch(`media/${item.id}/`, { status: nextStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      // Rollback on error
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, status: item.status } : m))
      );
      alert('Could not update status.');
    }
  };

  // Update rating star
  const handleRateItem = async (itemId, newRating) => {
    // Optimistic UI update
    setMediaList((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, rating: newRating } : m))
    );

    try {
      await api.patch(`media/${itemId}/`, { rating: newRating });
    } catch (err) {
      console.error('Error updating rating:', err);
      alert('Could not save rating.');
      fetchMedia(); // Refetch to reset
    }
  };

  // Delete media item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from your watchlist?')) {
      return;
    }

    setMediaList((prev) => prev.filter((m) => m.id !== itemId));

    try {
      await api.delete(`media/${itemId}/`);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item.');
      fetchMedia();
    }
  };

  // Filter items by tab and search
  const unwatchedItems = mediaList.filter((m) => m.status === 'Unwatched');
  const watchedItems = mediaList.filter((m) => m.status === 'Watched');

  const filteredItems = (activeTab === 'Unwatched' ? unwatchedItems : watchedItems).filter(
    (item) => item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="navbar glassmorphism">
        <div className="navbar-brand">
          <div className="brand-logo-small">
            <Film size={22} />
          </div>
          <h2>CineWatch</h2>
        </div>

        <div className="navbar-actions">
          <div className="user-pill">
            <User size={16} />
            <span>{user?.username || 'User'}</span>
          </div>
          <button className="btn-secondary logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-content">
        {/* Banner Section */}
        <section className="dashboard-hero">
          <div className="hero-text">
            <h1>
              My Watchlist <Sparkles size={24} className="sparkle-icon" />
            </h1>
            <p>Keep track of movies & TV shows you want to watch and rate your favorites.</p>
          </div>

          <button className="btn-primary add-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Add New Title</span>
          </button>
        </section>

        {/* Filters & Tabs Header */}
        <div className="dashboard-controls glassmorphism">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'Unwatched' ? 'active' : ''}`}
              onClick={() => setActiveTab('Unwatched')}
            >
              <Clock size={16} />
              <span>To Watch</span>
              <span className="badge">{unwatchedItems.length}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'Watched' ? 'active' : ''}`}
              onClick={() => setActiveTab('Watched')}
            >
              <CheckCircle2 size={16} />
              <span>Watched</span>
              <span className="badge">{watchedItems.length}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="empty-state">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading your watchlist...</p>
          </div>
        ) : error ? (
          <div className="empty-state error">
            <p>{error}</p>
            <button className="btn-secondary" onClick={fetchMedia}>
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state glassmorphism">
            {activeTab === 'Unwatched' ? (
              <>
                <Film size={48} className="empty-icon" />
                <h3>No movies or shows to watch yet</h3>
                <p>Add a new title to get started with your watchlist.</p>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} /> Add First Title
                </button>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="empty-icon" />
                <h3>No watched titles yet</h3>
                <p>Mark items from your "To Watch" list as watched when you finish them.</p>
              </>
            )}
          </div>
        ) : (
          <div className="media-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="media-card glassmorphism">
                <div className="card-top">
                  <span className={`type-tag ${item.type.toLowerCase()}`}>
                    {item.type === 'Movie' ? <Film size={12} /> : <Tv size={12} />}
                    {item.type}
                  </span>

                  <button
                    className="delete-icon-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="media-title">{item.title}</h3>

                {/* Rating component (always visible or in watched tab) */}
                <div className="rating-section">
                  <span className="rating-label">
                    {item.status === 'Watched' ? 'Your Rating:' : 'Rating:'}
                  </span>
                  <StarRating
                    rating={item.rating || 0}
                    onRate={(newRating) => handleRateItem(item.id, newRating)}
                  />
                </div>

                <div className="card-actions">
                  <button
                    className={`btn-action ${
                      item.status === 'Watched' ? 'btn-unwatch' : 'btn-watch'
                    }`}
                    onClick={() => handleToggleStatus(item)}
                  >
                    {item.status === 'Watched' ? (
                      <>
                        <RotateCcw size={14} /> Move to Unwatched
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Mark as Watched
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Media Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glassmorphism" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Watchlist</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="modal-form">
              <div className="form-group">
                <label htmlFor="media-title">Title</label>
                <input
                  id="media-title"
                  type="text"
                  placeholder="e.g. Inception, Breaking Bad"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Media Type</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-btn ${newType === 'Movie' ? 'selected' : ''}`}
                    onClick={() => setNewType('Movie')}
                  >
                    <Film size={16} /> Movie
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${newType === 'TV' ? 'selected' : ''}`}
                    onClick={() => setNewType('TV')}
                  >
                    <Tv size={16} /> TV Show
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
