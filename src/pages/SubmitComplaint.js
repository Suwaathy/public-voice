import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const getPriority = (text) => {
  if (!text) return 'Low';
  const t = text.toLowerCase();
  if (t.includes('danger') || t.includes('urgent') || t.includes('accident') ||
      t.includes('emergency') || t.includes('fire') || t.includes('flood') ||
      t.includes('அபாயம்') || t.includes('அவசரம்') || t.includes('හදිසි')) return 'Critical';
  if (t.includes('broken') || t.includes('damage') || t.includes('leak') ||
      t.includes('burst') || t.includes('உடைந்த') || t.includes('කැඩුණු')) return 'High';
  if (t.includes('problem') || t.includes('issue') || t.includes('bad') ||
      t.includes('பிரச்சனை') || t.includes('ගැටලුව')) return 'Medium';
  return 'Low';
};

const priorityBg = {
  Critical: '#FEE2E2', High: '#FEF3C7',
  Medium: '#DBEAFE', Low: '#D1FAE5'
};
const priorityTxt = {
  Critical: '#DC2626', High: '#D97706',
  Medium: '#1A56DB', Low: '#059669'
};

const SubmitComplaint = () => {
  const { i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState('text');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en');
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const [form, setForm] = useState({
    category: '', location: '', description: '',
    transcription: '', image: null, priority: '',
    images: [],
  });
  // ── HANDLE INPUT CHANGES ──────────────────────────
const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
}, []);

  const startSpeechRecognition = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      'Speech Recognition is not supported. Please use Google Chrome.'
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognitionRef.current = recognition;

  recognition.continuous = true;
  recognition.interimResults = true;

  const languageMap = {
    en: 'en-US',
    ta: 'ta-LK',
    si: 'si-LK',
  };

  recognition.lang = languageMap[voiceLang] || 'en-US';

  setRecording(true);
  setRecordingTime(0);

  timerRef.current = setInterval(() => {
    setRecordingTime((prev) => prev + 1);
  }, 1000);

  recognition.start();

  recognition.onresult = (event) => {
    let transcript = '';

    for (
      let i = 0;
      i < event.results.length;
      i++
    ) {
      transcript += event.results[i][0].transcript + ' ';
    }

    setForm((prev) => ({
      ...prev,
      transcription: transcript,
    }));
  };

  recognition.onerror = (event) => {
    console.error('Speech Error:', event.error);

    clearInterval(timerRef.current);

    setRecording(false);

    alert(
      'Speech recognition failed: ' + event.error
    );
  };

  recognition.onend = () => {
    clearInterval(timerRef.current);
    setRecording(false);
  };
};
  // ── STop RECORDING ──────────────────────────────
  const stopRecording = () => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }

  if (timerRef.current) {
    clearInterval(timerRef.current);
  }

  setRecording(false);
};

  // ── SUBMIT COMPLAINT ─────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const finalText = form.description || form.transcription;
      const priority = getPriority(finalText);

      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('location', form.location);
      formData.append('description', form.description || '');
      formData.append('transcription', form.transcription || '');
      formData.append('inputMethod', tab);
      formData.append('language', i18n.language || voiceLang || 'en');

      // Support up to 10 images (backend expects field "images")
      if (Array.isArray(form.images) && form.images.length) {
        form.images.forEach((img) => formData.append('images', img));
      } else if (form.image) {
        formData.append('image', form.image);
      }

      await axios.post('http://localhost:5000/api/complaints', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm(f => ({ ...f, priority }));
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ category: '', location: '', description: '', transcription: '', image: null, images: [], priority: '' });
    setStep(1); setTab('text'); setSubmitted(false);
  };

  const finalText = form.description || form.transcription;
  const autoPriority = getPriority(finalText);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const categoryOptions = [
    { val: 'Roads', label: 'Roads & Infrastructure' },
    { val: 'Water', label: 'Water & Sanitation' },
    { val: 'Safety', label: 'Public Safety' },
    { val: 'Environment', label: 'Environment' },
    { val: 'Corruption', label: 'Corruption' },
    { val: 'Other', label: 'Other' },
  ];

  const steps = ['Details', 'Input', 'Review', 'Submit'];

  // ── SUCCESS SCREEN ────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#059669', marginBottom: '8px', fontSize: '24px' }}>
            Complaint Submitted!
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '16px' }}>
            Your complaint has been received and the relevant authority has been notified by email.
          </p>
          <div style={{
            ...styles.badge,
            backgroundColor: priorityBg[form.priority || autoPriority],
            color: priorityTxt[form.priority || autoPriority],
            display: 'inline-block',
            padding: '8px 24px',
            fontSize: '16px',
            marginBottom: '24px',
          }}>
            Priority: {form.priority || autoPriority}
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>
            You can track your complaint status under <strong>My Complaints</strong>.
          </p>
          <button style={styles.btn} onClick={resetForm}>
            Submit Another Complaint
          </button>
        </div>
      </div>
    );
  }
  

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Submit Complaint</h2>

        {/* Step Indicator */}
        <div style={styles.steps}>
          {steps.map((s, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepNum,
                backgroundColor: step > i + 1 ? '#059669' : step === i + 1 ? '#1A56DB' : '#E5E7EB',
                color: step >= i + 1 ? '#fff' : '#9CA3AF',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '11px',
                color: step >= i + 1 ? '#1A56DB' : '#9CA3AF',
                fontWeight: step === i + 1 ? '700' : '400',
              }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* ── STEP 1: DETAILS ── */}
        {step === 1 && (
          <div>
            <label style={styles.label}>Category *</label>
            <select name="category" value={form.category}
              onChange={handleChange} style={styles.input}>
              <option value="">Select a category</option>
              {categoryOptions.map(c => (
                <option key={c.val} value={c.val}>{c.label}</option>
              ))}
            </select>

            <label style={styles.label}>Location *</label>
            <input name="location"
              placeholder="e.g. Kandy Town, Peradeniya Road"
              value={form.location} onChange={handleChange} style={styles.input} />

            <label style={styles.label}>Brief Description (optional)</label>
            <textarea name="description"
              placeholder="Short description of the issue..."
              value={form.description} onChange={handleChange}
              style={{ ...styles.input, height: '90px', resize: 'vertical' }} />

            <button
              style={{ ...styles.btn, opacity: !form.category || !form.location ? 0.5 : 1 }}
              onClick={() => {
                if (!form.category || !form.location) {
                  alert('Please select a category and enter a location.');
                } else { setStep(2); }
              }}>
              Next →
            </button>
          </div>
        )}

        {/* ── STEP 2: INPUT ── */}
        {step === 2 && (
          <div>
            {/* Tabs */}
            <div style={styles.tabs}>
              {[
                { key: 'text', label: '✍️ Type' },
                { key: 'voice', label: '🎤 Voice' },
                { key: 'image', label: '📷 Image' },
              ].map(tb => (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  style={{
                    ...styles.tab,
                    backgroundColor: tab === tb.key ? '#1A56DB' : '#F3F4F6',
                    color: tab === tb.key ? '#fff' : '#374151',
                  }}>
                  {tb.label}
                </button>
              ))}
            </div>

            {/* ── TEXT TAB ── */}
            {tab === 'text' && (
              <div>
                <label style={styles.label}>Describe your complaint in detail *</label>
                <textarea name="description"
                  placeholder="Describe the issue clearly — what it is, how long it has been happening, how it affects people..."
                  value={form.description} onChange={handleChange}
                  style={{ ...styles.input, height: '150px', resize: 'vertical' }} />
              </div>
            )}

            {/* ── VOICE TAB ── */}
            {tab === 'voice' && (
              <div style={styles.voiceBox}>

                {/* Language selector */}
                <div style={styles.langSelector}>
                  <label style={{ ...styles.label, marginBottom: '8px' }}>
                    Select your speaking language
                  </label>
                  <div style={styles.langBtns}>
                    {[
                      { code: 'en', label: '🇬🇧 English' },
                      { code: 'ta', label: '🇱🇰 Tamil' },
                      { code: 'si', label: '🇱🇰 Sinhala' },
                    ].map(l => (
                      <button key={l.code} onClick={() => setVoiceLang(l.code)}
                        style={{
                          ...styles.langChoiceBtn,
                          backgroundColor: voiceLang === l.code ? '#1A56DB' : '#F3F4F6',
                          color: voiceLang === l.code ? '#fff' : '#374151',
                          border: voiceLang === l.code ? '2px solid #1A56DB' : '2px solid #E5E7EB',
                        }}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <p style={styles.voiceInstruction}>
                  {voiceLang === 'en' && '🎤 Click Start and speak your complaint clearly in English'}
                  {voiceLang === 'ta' && '🎤 Start பொத்தானை அழுத்தி தமிழில் தெளிவாக பேசுங்கள்'}
                  {voiceLang === 'si' && '🎤 Start බොත්තම 누르ා සිංහලෙන් පැහැදිලිව කතා කරන්න'}
                </p>

                {/* Record button */}
                <div style={styles.recordArea}>
                  {recording && (
                    <div style={styles.recordingPulse}>
                      <div style={styles.pulseRing} />
                      <div style={styles.pulseCore} />
                    </div>
                  )}

                  {!recording ? (
            <button
              onClick={startSpeechRecognition}
              style={{
                ...styles.micBtn,
                backgroundColor: '#1A56DB',
              }}>
              🎤 Start Speaking
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                ...styles.micBtn,
                backgroundColor: '#DC2626',
              }}>
              ⏹ Stop Speaking
            </button>
          )}

                  {recording && (
                    <div style={styles.timer}>
                      <span style={styles.redDot} />
                      Recording: {formatTime(recordingTime)}
                    </div>
                  )}
                </div>

                {/* Transcription Result */}
                {form.transcription && (
                  <div style={styles.transcriptionBox}>
                    <div style={styles.transcriptionHeader}>
                      <span>🤖 AI Transcription ({voiceLang === 'en' ? 'English' : voiceLang === 'ta' ? 'Tamil' : 'Sinhala'})</span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        You can edit this text
                      </span>
                    </div>
                    <textarea
                      value={form.transcription}
                      onChange={e => setForm({ ...form, transcription: e.target.value })}
                      style={{
                        ...styles.input,
                        height: '100px',
                        marginBottom: 0,
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: 'inherit',
                      }} />
                    <div style={styles.transcriptionFooter}>
                      <button
                        onClick={() => setForm({ ...form, transcription: '' })}
                        style={styles.clearBtn}>
                        🗑 Clear & Re-record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── IMAGE TAB ── */}
            {tab === 'image' && (
              <div>
                <div style={styles.dropZone}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files || []).filter(f => f?.type?.startsWith('image/'));
                    if (files.length) {
                      const sliced = files.slice(0, 10);
                      // Keep backward-compatible single image field too
                      setForm({ ...form, images: sliced, image: sliced[0] });
                    }
                  }}>

                  <p style={{ fontSize: '40px', margin: '0 0 8px' }}>📎</p>
                  <p style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Drag & drop your image here
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '16px' }}>
                    or click below to browse
                  </p>
                      <label style={styles.uploadLabel}>
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).filter(f => f?.type?.startsWith('image/'));
                        if (files.length) {
                          const sliced = files.slice(0, 10);
                          setForm({ ...form, images: sliced, image: sliced[0] });
                        }
                      }}
                    />
                  </label>
                </div>

                {Array.isArray(form.images) && form.images.length > 0 && (
                  <div style={styles.imagePreview}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: 10 }}>
                      {form.images.slice(0, 10).map((img, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(img)}
                          alt={`preview-${idx}`}
                          style={{ width: 'calc(33.333% - 7px)', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#059669', fontSize: '13px' }}>✓ {form.images.length} image(s)</span>
                      <button
                        onClick={() => setForm({ ...form, images: [], image: null })}
                        style={styles.removeBtn}>✕ Remove</button>
                    </div>
                  </div>
                )}


                <label style={{ ...styles.label, marginTop: '16px' }}>
                  Add description (optional)
                </label>
                <textarea name="description"
                  placeholder="Describe what the image shows..."
                  value={form.description} onChange={handleChange}
                  style={{ ...styles.input, height: '80px', resize: 'vertical' }} />
              </div>
            )}

            <div style={styles.navBtns}>
              <button style={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button
                style={{
                  ...styles.btn,
                  opacity: (!form.description && !form.transcription && !form.image) ? 0.5 : 1
                }}
                onClick={() => {
                  if (!form.description && !form.transcription && !form.image) {
                    alert('Please add your complaint via text, voice, or image.');
                  } else { setStep(3); }
                }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 3 && (
          <div>
            <h3 style={styles.reviewTitle}>Review your complaint</h3>
            <div style={styles.reviewBox}>
              {[
                { label: 'Category', value: categoryOptions.find(c => c.val === form.category)?.label },
                { label: 'Location', value: form.location },
                { label: 'Description', value: form.description || form.transcription },
                { label: 'Input Method', value: tab === 'voice' ? '🎤 Voice (AI transcribed)' : tab === 'image' ? '📷 Image upload' : '✍️ Text' },
                ...(tab === 'voice' ? [{ label: 'Language', value: voiceLang === 'en' ? 'English' : voiceLang === 'ta' ? 'Tamil' : 'Sinhala' }] : []),
                ...(Array.isArray(form.images) && form.images.length
                  ? [{ label: 'Images', value: `📎 ${form.images.length} selected` }]
                  : form.image
                  ? [{ label: 'Image', value: `📎 ${form.image.name}` }]
                  : []),
              ].map((row, i) => (
                <div key={i} style={{ ...styles.reviewRow, borderBottom: '1px solid #E5E7EB' }}>
                  <span style={styles.reviewLabel}>{row.label}</span>
                  <span style={styles.reviewValue}>{row.value}</span>
                </div>
              ))}
              <div style={{ ...styles.reviewRow, borderBottom: 'none' }}>
                <span style={styles.reviewLabel}>Auto Priority</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: priorityBg[autoPriority],
                  color: priorityTxt[autoPriority],
                }}>
                  {autoPriority}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '20px' }}>
              ℹ️ Priority is automatically assigned based on your complaint content.
              The relevant authority will be notified by email.
            </p>
            <div style={styles.navBtns}>
              <button style={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
              <button style={styles.btn} onClick={() => setStep(4)}>Looks good →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: SUBMIT ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🚀</div>
            <h3 style={{ color: '#111827', marginBottom: '8px', fontSize: '18px' }}>
              Ready to submit?
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
              Your complaint will be submitted and the relevant authority will be
              automatically notified by email based on the category you selected.
            </p>
            <button
              style={{ ...styles.btn, width: '100%', padding: '16px', fontSize: '16px', opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '✅ Submit Complaint'}
            </button>
            <button style={{ ...styles.backBtn, marginTop: '12px', width: '100%' }}
              onClick={() => setStep(3)}>
              ← Go Back and Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 16px', display: 'flex', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '640px', height: 'fit-content' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '28px', textAlign: 'center' },
  steps: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  stepNum: { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', transition: 'all 0.3s' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { backgroundColor: '#1A56DB', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', float: 'right' },
  backBtn: { backgroundColor: '#F3F4F6', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  navBtns: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', overflow: 'hidden' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
  voiceBox: { textAlign: 'center', padding: '10px 0 20px' },
  langSelector: { marginBottom: '20px', textAlign: 'left' },
  langBtns: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' },
  langChoiceBtn: { padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  voiceInstruction: { color: '#6B7280', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5', padding: '0 20px' },
  recordArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '20px', position: 'relative' },
  recordingPulse: { position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.2)', animation: 'pulse 1.5s infinite' },
  pulseCore: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.4)' },
  micBtn: { color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s', minWidth: '200px' },
  timer: { display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: '600', fontSize: '16px' },
  redDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'inline-block', animation: 'blink 1s infinite' },
  transcribingBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1A56DB', fontSize: '14px', marginTop: '16px' },
  spinner: { width: '18px', height: '18px', border: '3px solid #BFDBFE', borderTopColor: '#1A56DB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  transcriptionBox: { marginTop: '16px', border: '2px solid #1A56DB', borderRadius: '10px', overflow: 'hidden', textAlign: 'left', backgroundColor: '#fff' },
  transcriptionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#EFF6FF', fontSize: '13px', fontWeight: '600', color: '#1A56DB' },
  transcriptionFooter: { padding: '8px 14px', borderTop: '1px solid #BFDBFE', display: 'flex', justifyContent: 'flex-end' },
  clearBtn: { background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  dropZone: { border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', color: '#6B7280', marginBottom: '12px', backgroundColor: '#FAFAFA' },
  uploadLabel: { backgroundColor: '#1A56DB', color: '#fff', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  imagePreview: { backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '12px', marginBottom: '12px' },
  removeBtn: { background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  reviewTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' },
  reviewBox: { backgroundColor: '#F9FAFB', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E5E7EB' },
  reviewRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', gap: '12px', flexWrap: 'wrap' },
  reviewLabel: { fontSize: '13px', fontWeight: '600', color: '#6B7280', flexShrink: 0 },
  reviewValue: { fontSize: '14px', color: '#111827', textAlign: 'right', flex: 1 },
  badge: { padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' },
};

export default SubmitComplaint;