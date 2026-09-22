import { useMemo, useState } from 'react';
import {
  describeError,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

const GAMES = [
  'Marvel Rivals',
  'Overwatch 2',
  'League of Legends',
  'Valorant',
  'Rocket League',
  'Rainbow Six',
  'Call of Duty',
  'Super Smash Bros.',
  'EA Sports FC',
  'Madden',
  'Marvel Tōkon',
  'Tekken 8',
  'Mortal Kombat 1',
  'Street Fighter 6',
  'Guilty Gear',
];

const RATINGS = [
  [
    'mechanics',
    'Mechanics',
    'Execution, controls, aim, movement, combos, or technical skill.',
  ],
  [
    'gameKnowledge',
    'Game Knowledge',
    'Maps, matchups, objectives, strategy, and game rules.',
  ],
  [
    'communication',
    'Communication',
    'Clear callouts, listening, useful information, and composure.',
  ],
  [
    'teamwork',
    'Teamwork',
    'Works with teammates instead of only playing for individual results.',
  ],
  [
    'adaptability',
    'Adaptability',
    'Adjusts to opponents, roles, strategies, and changing situations.',
  ],
  [
    'coachability',
    'Coachability',
    'Receives feedback and attempts to apply corrections.',
  ],
  [
    'overallPerformance',
    'Overall Performance',
    'Overall tryout performance based on the full evaluation.',
  ],
];

const EMPTY = {
  game: '',
  evaluator: '',
  tryoutDate: '',

  playerFirstName: '',
  playerLastName: '',
  gNumber: '',
  schoolEmail: '',

  discordName: '',
  inGameName: '',
  primaryRole: '',
  currentRank: '',

  mechanics: 0,
  gameKnowledge: 0,
  communication: 0,
  teamwork: 0,
  adaptability: 0,
  coachability: 0,
  overallPerformance: 0,

  strengths: '',
  improvementAreas: '',
  captainNotes: '',
  recommendation: '',

  website: '',
};

export default function TryoutFormPage() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const ratingsComplete = useMemo(
    () => RATINGS.every(([key]) => Number(form[key]) >= 1),
    [form],
  );

  const change = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setStatus(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    // Hidden anti-bot field.
    if (form.website) {
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus({
        tone: 'error',
        message: 'Supabase is not configured yet.',
      });
      return;
    }

    if (!ratingsComplete) {
      setStatus({
        tone: 'error',
        message: 'Complete every 1-5 performance rating.',
      });
      return;
    }

    if (!form.recommendation) {
      setStatus({
        tone: 'error',
        message: 'Choose a roster recommendation.',
      });
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const payload = {
        game: form.game,
        evaluator: form.evaluator.trim(),
        tryout_date: form.tryoutDate,

        player_first_name: form.playerFirstName.trim(),
        player_last_name: form.playerLastName.trim(),
        g_number: form.gNumber.trim(),
        school_email: form.schoolEmail.trim(),

        discord_name: form.discordName.trim(),
        in_game_name: form.inGameName.trim() || null,
        primary_role: form.primaryRole.trim(),
        current_rank: form.currentRank.trim() || null,

        mechanics: Number(form.mechanics),
        game_knowledge: Number(form.gameKnowledge),
        communication: Number(form.communication),
        teamwork: Number(form.teamwork),
        adaptability: Number(form.adaptability),
        coachability: Number(form.coachability),
        overall_performance: Number(form.overallPerformance),

        strengths: form.strengths.trim(),
        improvement_areas: form.improvementAreas.trim() || null,
        captain_notes: form.captainNotes.trim() || null,

        recommendation: form.recommendation,
      };

      const { error } = await supabase
        .from('tryout_submissions')
        .insert(payload);

      if (error) {
        throw error;
      }

      setForm(EMPTY);

      setStatus({
        tone: 'success',
        message: 'Tryout evaluation submitted successfully.',
      });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: describeError(error),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <header className="brand">
        <div className="shell brand-inner">
          <div>
            <p className="eyebrow">San Jac Ravens Esports</p>
            <h1>Captain Tryout Evaluation</h1>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="shell hero-inner">
          <p className="eyebrow">San Jac Ravens Esports Tryouts</p>

          <h2>
            Captain Eval Form
            <span>Evaluation Form</span>
          </h2>

          <p>
            Use this form to evaluate each player during tryouts. Rate their
            performance, communication, teamwork, game knowledge, adaptability,
            coachability, and overall fit for the team.
          </p>
        </div>
      </section>

      <div className="shell content">
        {status && (
          <div className={`status ${status.tone}`}>
            <strong>
              {status.tone === 'success'
                ? 'Evaluation submitted'
                : 'Check the form'}
            </strong>

            <br />

            {status.message}
          </div>
        )}

        <form onSubmit={submit}>
          {/* Hidden honeypot field */}
          <input
            style={{ display: 'none' }}
            name="website"
            value={form.website}
            onChange={change}
            tabIndex="-1"
            autoComplete="off"
          />

          <Section
            n="01"
            title="Tryout Information"
            desc="Identify the team, evaluator, and tryout session."
          >
            <div className="grid grid-3">
              <Select
                label="Game / Team"
                name="game"
                value={form.game}
                onChange={change}
                required
              >
                <option value="">Select game</option>

                {GAMES.map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </Select>

              <Input
                label="Captain / Evaluator"
                name="evaluator"
                value={form.evaluator}
                onChange={change}
                required
              />

              <Input
                label="Tryout Date"
                name="tryoutDate"
                type="date"
                value={form.tryoutDate}
                onChange={change}
                required
              />
            </div>
          </Section>

          <Section
            n="02"
            title="Player Information"
            desc="Enter the student's identification and esports information."
          >
            <div className="grid grid-4">
              <Input
                label="First Name"
                name="playerFirstName"
                value={form.playerFirstName}
                onChange={change}
                required
              />

              <Input
                label="Last Name"
                name="playerLastName"
                value={form.playerLastName}
                onChange={change}
                required
              />

              <Input
                label="G-Number"
                name="gNumber"
                value={form.gNumber}
                onChange={change}
                placeholder="G########"
                required
              />

              <Input
                label="School Email"
                name="schoolEmail"
                type="email"
                value={form.schoolEmail}
                onChange={change}
                placeholder="student@stu.sanjac.edu"
                required
              />
            </div>

            <div
              className="grid grid-4"
              style={{ marginTop: 18 }}
            >
              <Input
                label="Discord Name"
                name="discordName"
                value={form.discordName}
                onChange={change}
                required
              />

              <Input
                label="In-Game Name"
                name="inGameName"
                value={form.inGameName}
                onChange={change}
              />

              <Input
                label="Primary Role / Position"
                name="primaryRole"
                value={form.primaryRole}
                onChange={change}
                required
              />

              <Input
                label="Current Rank"
                name="currentRank"
                value={form.currentRank}
                onChange={change}
              />
            </div>
          </Section>

          <Section
            n="03"
            title="Performance Evaluation"
            desc="Rate each category from 1 to 5."
          >
            <div className="rating-list">
              {RATINGS.map(([key, label, description]) => (
                <div
                  className="rating-row"
                  key={key}
                >
                  <div>
                    <h4>{label}</h4>
                    <p>{description}</p>
                  </div>

                  <div className="rating-buttons">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`rating-button ${
                          form[key] === score ? 'active' : ''
                        }`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            [key]: score,
                          }))
                        }
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            n="04"
            title="Captain Observations"
            desc="Document specific observations from the tryout."
          >
            <div className="grid grid-2">
              <TextArea
                label="Player Strengths"
                name="strengths"
                value={form.strengths}
                onChange={change}
                required
              />

              <TextArea
                label="Areas for Improvement"
                name="improvementAreas"
                value={form.improvementAreas}
                onChange={change}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <TextArea
                label="Captain Notes"
                name="captainNotes"
                value={form.captainNotes}
                onChange={change}
                rows={5}
              />
            </div>
          </Section>

          <Section
            n="05"
            title="Roster Recommendation"
            desc="Select the captain's recommendation."
          >
            <div className="recommend-grid">
              <Recommendation
                value="recommend"
                title="Recommend"
                description="Strong candidate for the roster."
                current={form.recommendation}
                setForm={setForm}
              />

              <Recommendation
                value="consider"
                title="Consider"
                description="Needs another review or additional tryout."
                current={form.recommendation}
                setForm={setForm}
              />

              <Recommendation
                value="not-recommended"
                title="Not Recommended"
                description="Not currently recommended for the roster."
                current={form.recommendation}
                setForm={setForm}
              />
            </div>
          </Section>

          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setForm(EMPTY);
                setStatus(null);
              }}
              disabled={busy}
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>

      <footer className="footer">
        <div className="shell">
          <strong>San Jac Ravens Esports</strong>
          <br />
          Captain Tryout Evaluation System
        </div>
      </footer>
    </main>
  );
}

function Section({ n, title, desc, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="panel-num">{n}</div>

        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      </div>

      <div className="panel-body">
        {children}
      </div>
    </section>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="field">
      <span className="label">{label}</span>

      <input
        className="control"
        {...props}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="field">
      <span className="label">{label}</span>

      <select
        className="control"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, rows = 4, ...props }) {
  return (
    <label className="field">
      <span className="label">{label}</span>

      <textarea
        className="control"
        rows={rows}
        {...props}
      />
    </label>
  );
}

function Recommendation({
  value,
  title,
  description,
  current,
  setForm,
}) {
  return (
    <button
      type="button"
      className={`recommend ${
        current === value ? 'active' : ''
      }`}
      onClick={() =>
        setForm((form) => ({
          ...form,
          recommendation: value,
        }))
      }
    >
      <h4>{title}</h4>
      <p>{description}</p>
    </button>
  );
}
