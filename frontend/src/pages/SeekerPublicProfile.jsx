import "../styles/SeekerPublicProfile.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

const SeekerPublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeeker = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/seekers/${id}`);
        setSeeker(res.data.data);
      } catch (err) {
        console.error("Error fetching seeker:", err);
        setError("Seeker not found");
      } finally {
        setLoading(false);
      }
    };
    fetchSeeker();
  }, [id]);

  if (loading) return <div className="seeker-public-loading">Loading...</div>;
  if (error || !seeker)
    return (
      <div className="seeker-public-empty">
        <p>{error || "Seeker not found"}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go back
        </button>
      </div>
    );

  const user = seeker.user || {};
  const photo =
    seeker.photo && seeker.photo.startsWith("http")
      ? seeker.photo
      : seeker.photo
      ? `${import.meta.env.VITE_API_URL}/storage/${seeker.photo}`
      : "";

  const skills = seeker.skillsList || seeker.skills_list || seeker.skills || [];
  const projects = seeker.projects || [];

  return (
    <div className="seeker-public-page">
      <div className="seeker-public-header">
        <button onClick={() => navigate(-1)} className="btn-back-arrow">
          ← Back
        </button>
      </div>

      <div className="seeker-public-container">
        <aside className="seeker-public-aside">
          <div className="seeker-photo-wrap">
            {photo ? (
              <img
                src={photo}
                alt={user.name || "Seeker"}
                className="seeker-photo"
              />
            ) : (
              <div className="seeker-photo-placeholder">
                {(user.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="seeker-name">
            {user.name || seeker.name || "Unknown"}
          </h2>
          {user.email && (
            <a className="seeker-contact" href={`mailto:${user.email}`}>
              {user.email}
            </a>
          )}
          {user.phone_number || user.phone ? (
            <div className="seeker-contact">
              {user.phone_number || user.phone}
            </div>
          ) : null}

          <div className="seeker-meta">
            <div className="seeker-meta-item">
              <strong>Skills</strong>
              <div className="skills-list">
                {skills.length === 0 ? (
                  <span className="no-skills">No skills listed</span>
                ) : (
                  skills.map((s) => (
                    <span key={s.id || s.name} className="skill-badge">
                      {s.name || s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="seeker-public-main">
          <section className="seeker-about">
            <h3>About</h3>
            <p className="seeker-description">
              {seeker.description || "No description provided."}
            </p>
          </section>

          <section className="seeker-projects">
            <h3>Projects</h3>
            {projects.length === 0 ? (
              <p className="empty">No projects listed.</p>
            ) : (
              <div className="projects-list">
                {projects.map((p) => (
                  <div key={p.id} className="project-card">
                    <div className="project-head">
                      <strong className="project-title">{p.title}</strong>
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          View
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="project-desc">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default SeekerPublicProfilePage;
