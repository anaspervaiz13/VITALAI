import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Thermometer, Brain, Heart, Info, AlertTriangle, CheckCircle, ChevronLeft, RefreshCcw } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

const API_BASE = 'http://localhost:8000';

const diseaseIcons = {
  Diabetes: <Brain className="text-blue-400" size={24} />,
  Hypertension: <Activity className="text-orange-400" size={24} />,
  HeartDisease: <Heart className="text-red-400" size={24} />
};

function App() {
  const [formData, setFormData] = useState({
    age: 45,
    sex: 1,
    gen_health: 3,
    bmi: 25.5,
    phys_health: 0,
    smoke_status: 2,
    high_chol: 2,
    exercise: 1,
    // New Clinical Fields
    bp_meds: 2,
    stroke_hist: 2,
    heart_attack: 2,
    alcohol: 888,
    health_insurance: 1
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const getPrediction = async () => {
    setLoading(true);
    setError(null);
    console.log("📤 Sending Analysis Request:", formData);
    try {
      const resp = await axios.post(`${API_BASE}/predict`, formData);
      console.log("📥 AI Response Received:", resp.data);
      setPrediction(resp.data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to AI engine. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <nav style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="bg-gradient" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>VITAL<span style={{ color: 'var(--primary)' }}>AI</span></h1>
        </div>
        <div className="glass" style={{ padding: '0.5rem 1.5rem', borderRadius: '100px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Disease Prediction Dashboard
        </div>
      </nav>

      <main style={{ flex: 1, padding: '0 2rem 4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: prediction ? '1fr' : '1fr', gap: '2rem' }}>

          <AnimatePresence mode="wait">
            {!prediction ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass"
                style={{ padding: '3rem' }}
              >
                <div style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Patient Health Profile</h2>
                  <p style={{ color: 'var(--text-dim)' }}>Complete the clinical health assessment for our Neural Network Engine.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                  {/* SECTION 1: PERSONAL METRICS */}
                  <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                    <h4 style={{ color: 'var(--primary)' }}>Personal Metrics</h4>
                  </div>
                  <div className="input-group">
                    <label>Patient Age (Years)</label>
                    <input name="age" type="number" value={formData.age} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Biological Sex</label>
                    <select name="sex" value={formData.sex} onChange={handleInputChange}>
                      <option value={1}>Male</option>
                      <option value={2}>Female</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Calculated BMI ({formData.bmi})</label>
                    <input name="bmi" type="range" min="15" max="50" step="0.1" value={formData.bmi} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>General Health Self-Score (1: Exc, 5: Poor)</label>
                    <input name="gen_health" type="number" min="1" max="5" value={formData.gen_health} onChange={handleInputChange} />
                  </div>

                  {/* SECTION 2: CLINICAL HISTORY */}
                  <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                    <h4 style={{ color: 'var(--secondary)' }}>Clinical History</h4>
                  </div>
                  <div className="input-group">
                    <label>High Cholesterol Diagnosis</label>
                    <select name="high_chol" value={formData.high_chol} onChange={handleInputChange}>
                      <option value={1}>Confirmed</option>
                      <option value={2}>None / Healthy</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Blood Pressure Medication</label>
                    <select name="bp_meds" value={formData.bp_meds} onChange={handleInputChange}>
                      <option value={1}>Taking BP Medication</option>
                      <option value={2}>No Medication</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>History of Stroke</label>
                    <select name="stroke_hist" value={formData.stroke_hist} onChange={handleInputChange}>
                      <option value={1}>Yes</option>
                      <option value={2}>No</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>History of Heart Attack</label>
                    <select name="heart_attack" value={formData.heart_attack} onChange={handleInputChange}>
                      <option value={1}>Yes</option>
                      <option value={2}>No</option>
                    </select>
                  </div>

                  {/* SECTION 3: LIFESTYLE & ACCESS */}
                  <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                    <h4 style={{ color: 'var(--accent)' }}>Lifestyle & Socio-Economic Access</h4>
                  </div>
                  <div className="input-group">
                    <label>Smoking History (100+ cigarettes)</label>
                    <select name="smoke_status" value={formData.smoke_status} onChange={handleInputChange}>
                      <option value={1}>Yes</option>
                      <option value={2}>No</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Physical Activity (Last 30 days)</label>
                    <select name="exercise" value={formData.exercise} onChange={handleInputChange}>
                      <option value={1}>Active</option>
                      <option value={2}>Sedentary</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Alcohol Intake Frequency</label>
                    <select name="alcohol" value={formData.alcohol} onChange={handleInputChange}>
                      <option value={888}>Zero / Rare</option>
                      <option value={101}>Moderate</option>
                      <option value={210}>Heavy</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Healthcare Insurance Coverage</label>
                    <select name="health_insurance" value={formData.health_insurance} onChange={handleInputChange}>
                      <option value={1}>Covered</option>
                      <option value={2}>No Insurance</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={getPrediction}
                    disabled={loading}
                    className="bg-gradient"
                    style={{
                      padding: '1.2rem 2.5rem',
                      borderRadius: '16px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? <RefreshCcw className="animate-spin" /> : <Brain size={20} />}
                    {loading ? 'AI Analyzing...' : 'Predict Disease Risks'}
                  </button>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '300px' }}>
                    <AlertTriangle size={14} inline /> This tool is for educational purposes and provides risk estimates, not clinical diagnoses.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{ padding: '3rem' }}
              >
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                      onClick={reset}
                      style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Go Back"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div>
                      <h2 style={{ fontSize: '2.5rem', marginBottom: '0.1rem' }}>Risk Assessment Report</h2>
                      <p style={{ color: 'var(--text-dim)' }}>Analysis complete using the Neural Network Champion Engine.</p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="bg-gradient"
                    style={{ padding: '1rem 2rem', borderRadius: '12px', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ChevronLeft size={20} /> Back to Edit
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  {Object.entries(prediction).map(([name, data]) => (
                    <div key={name} className="glass" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        {diseaseIcons[name] || <Activity size={24} />}
                        <h3 style={{ fontSize: '1.3rem' }}>{name}</h3>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>{data.probability}%</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Probability Score</div>
                      </div>

                      <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        background: data.risk_level === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: data.risk_level === 'High' ? 'var(--danger)' : 'var(--success)',
                        border: `1px solid ${data.risk_level === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}>
                        {data.risk_level} Risk Category
                      </div>

                      {/* Visual Meter */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '2rem', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${data.probability}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{
                            height: '100%',
                            background: data.risk_level === 'High' ? 'var(--danger)' : data.risk_level === 'Moderate' ? 'var(--warning)' : 'var(--success)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary)', padding: '0.8rem', borderRadius: '12px' }}>
                    <CheckCircle color="white" size={24} />
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>AI Recommendations</h4>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                      Based on your input, the model suggests monitoring your cholesterol intake and maintaining regular physical activity.
                      Please consult with Prof. Amna Aftab or a licensed medical professional for clinical guidance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <AlertTriangle size={18} /> {error}
            </motion.div>
          )}
        </div>
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © 2026 IQRA UNIVERSITY CHAK SHAHZAD | Designed by Memoona Aqeel & Hadeesa Batool
      </footer>
    </div>
  );
}

export default App;
