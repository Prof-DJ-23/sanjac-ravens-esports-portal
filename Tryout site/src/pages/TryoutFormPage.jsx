import { useMemo, useState } from 'react';
import { supabase, describeError } from '../lib/supabase';

/*
|--------------------------------------------------------------------------
| San Jac Ravens Esports - Captain Tryout Evaluation
|--------------------------------------------------------------------------
|
| Public tryout form:
| - No portal account is required.
| - Captains submit one evaluation per player.
| - Data is saved to Supabase.
| - The browser can INSERT rows only. It cannot read tryout submissions.
|
| IMPORTANT:
| The matching Supabase SQL file in /supabase/08_tryout_submissions.sql
| must be run before this form can save data.
|
|--------------------------------------------------------------------------
*/

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

const RATING_FIELDS = [
  {
    key: 'mechanics',
    label: 'Mechanics',
    description: 'Execution, controls, aim, movement, combos, or technical skill.',
  },
  {
    key: 'gameKnowledge',
    label: 'Game Knowledge',
    description: 'Maps, matchups, objectives, strategy, and game rules.',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Clear callouts, listening, useful information, and composure.',
  },
  {
    key: 'teamwork',
    label: 'Teamwork',
    description: 'Works with teammates instead of playing only for individual results.',
  },
  {
    key: 'adaptability',
    label: 'Adaptability',
    description: 'Adjusts to opponents, roles, strategies, and changing situations.',
  },
  {
    key: 'coachability',
    label: 'Coachability',
    description: 'Receives feedback and attempts to apply corrections.',
  },
  {
    key: 'overallPerformance',
    label: 'Overall Performance',
    description: 'Overall tryout performance based on the full evaluation.',
  },
];

const EMPTY_FORM = {
  game: '',
  evaluator: '',
  tryoutDate: '',
  playerFirstName: '',
  playerLastInitial: '',
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
  website: '', // Honeypot field. Real users never see this.
};

export default function TryoutFormPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  // Make it easy to show whether every required rating has been selected.
  const ratingsComplete = useMemo(
    () => RATING_FIELDS.every((item) => Number(form[item.key]) >= 1),
    [form],
  );

  // Handles text fields, dropdowns, date fields, and textareas.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setStatus(null);
  };

  // Handles the 1-5 rating buttons.
  const setRating = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setStatus(null);
  };

  // Validate the few items that are not automatically validated by HTML.
  const validateForm = () => {
    if (!ratingsComplete) {
      return 'Please complete every 1-5 performance rating.';
    }

    if (!form.recommendation) {
      return 'Please choose a roster recommendation.';
    }

    return null;
  };

  // Saves one tryout evaluation to Supabase.
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic bot trap. Real users never see or fill this field.
    if (form.website) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setStatus({
        tone: 'critical',
        message: validationError,
      });
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      // Convert React field names into the SQL column names.
      const submission = {
        game: form.game,
        evaluator: form.evaluator.trim(),
        tryout_date: form.tryoutDate,

        player_first_name: form.playerFirstName.trim(),
        player_last_initial: form.playerLastInitial.trim().slice(0, 1).toUpperCase(),
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

      // RLS allows anonymous/public INSERTS only.
      // Public users cannot SELECT existing submissions.
      const { error } = await supabase
        .from('tryout_submissions')
        .insert(submission);

      if (error) {
        throw error;
      }

      setStatus({
        tone: 'positive',
        message: 'Tryout evaluation submitted successfully.',
      });

      // Clear the form after a successful submission so the captain can
      // immediately evaluate the next player.
      setForm(EMPTY_FORM);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      setStatus({
        tone: 'critical',
        message: describeError
          ? describeError(error)
          : error?.message || 'Unable to submit this evaluation.',
      });
    } finally {
      setBusy(false);
    }
  };

  // Clears the form manually.
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setStatus(null);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#002142]">
      {/* ================================================================ */}
      {/* BRAND HEADER                                                     */}
      {/* ================================================================ */}
      <header className="border-b-4 border-[#FFC61E] bg-[#002142]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFC61E]">
              San Jac Ravens Esports
            </p>

            <h1 className="mt-1 text-xl font-black uppercase text-white">
              Captain Tryout Evaluation
            </h1>
          </div>

          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Competitive Program
            </p>
            <p className="text-sm font-semibold text-white">
              Player Evaluation
            </p>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="bg-[#004C97] text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#FFC61E]">
            Tryout Day
          </p>

          <h2 className="max-w-3xl text-4xl font-black uppercase leading-tight md:text-5xl">
            Evaluate the player.
            <span className="block text-[#FFC61E]">
              Build the roster.
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">
            Complete one evaluation for each player. Focus on competitive
            performance, communication, teamwork, game knowledge, and
            coachability.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FORM                                                             */}
      {/* ================================================================ */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {status && (
          <div
            className={`mb-8 border-l-4 p-5 ${
              status.tone === 'positive'
                ? 'border-[#FFC61E] bg-[#002142] text-white'
                : 'border-red-600 bg-red-50 text-red-900'
            }`}
            role="status"
          >
            <p className="font-black uppercase">
              {status.tone === 'positive' ? 'Evaluation submitted' : 'Check the form'}
            </p>
            <p className="mt-1 text-sm">
              {status.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hidden honeypot. Bots may fill it; people will not. */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            tabIndex="-1"
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <FormSection
            number="01"
            title="Tryout Information"
            description="Identify the team, evaluator, and tryout session."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <SelectField
                label="Game / Team"
                name="game"
                value={form.game}
                onChange={handleChange}
                required
              >
                <option value="">Select game</option>

                {GAMES.map((game) => (
                  <option key={game} value={game}>
                    {game}
                  </option>
                ))}
              </SelectField>

              <InputField
                label="Captain / Evaluator"
                name="evaluator"
                value={form.evaluator}
                onChange={handleChange}
                placeholder="Captain name"
                maxLength={100}
                required
              />

              <InputField
                label="Tryout Date"
                name="tryoutDate"
                type="date"
                value={form.tryoutDate}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection
            number="02"
            title="Player Information"
            description="Record only the information needed for the esports tryout."
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <InputField
                label="First Name"
                name="playerFirstName"
                value={form.playerFirstName}
                onChange={handleChange}
                placeholder="First name"
                maxLength={80}
                required
              />

              <InputField
                label="Last Initial"
                name="playerLastInitial"
                value={form.playerLastInitial}
                onChange={handleChange}
                placeholder="T"
                maxLength={1}
                required
              />

              <InputField
                label="Discord Name"
                name="discordName"
                value={form.discordName}
                onChange={handleChange}
                placeholder="Discord username"
                maxLength={100}
                required
              />

              <InputField
                label="In-Game Name"
                name="inGameName"
                value={form.inGameName}
                onChange={handleChange}
                placeholder="IGN / Gamertag"
                maxLength={100}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <InputField
                label="Primary Role / Position"
                name="primaryRole"
                value={form.primaryRole}
                onChange={handleChange}
                placeholder="Example: Support, DPS, Jungle"
                maxLength={100}
                required
              />

              <InputField
                label="Current Rank"
                name="currentRank"
                value={form.currentRank}
                onChange={handleChange}
                placeholder="Example: Diamond, Platinum, Elite"
                maxLength={100}
              />
            </div>
          </FormSection>

          <FormSection
            number="03"
            title="Performance Evaluation"
            description="Rate each category from 1 to 5 based on what you observed."
          >
            <div className="space-y-4">
              {RATING_FIELDS.map((rating) => (
                <RatingRow
                  key={rating.key}
                  label={rating.label}
                  description={rating.description}
                  value={form[rating.key]}
                  onChange={(value) => setRating(rating.key, value)}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:grid-cols-5">
              <span><strong>1</strong> — Needs Improvement</span>
              <span><strong>2</strong> — Developing</span>
              <span><strong>3</strong> — Meets Expectations</span>
              <span><strong>4</strong> — Strong</span>
              <span><strong>5</strong> — Excellent</span>
            </div>
          </FormSection>

          <FormSection
            number="04"
            title="Captain Observations"
            description="Document specific observations instead of relying only on scores."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <TextAreaField
                label="Player Strengths"
                name="strengths"
                value={form.strengths}
                onChange={handleChange}
                placeholder="What did this player do well?"
                maxLength={2000}
                required
              />

              <TextAreaField
                label="Areas for Improvement"
                name="improvementAreas"
                value={form.improvementAreas}
                onChange={handleChange}
                placeholder="What needs additional development?"
                maxLength={2000}
              />
            </div>

            <div className="mt-6">
              <TextAreaField
                label="Captain Notes"
                name="captainNotes"
                value={form.captainNotes}
                onChange={handleChange}
                placeholder="Add role fit, communication notes, match observations, or other relevant information."
                rows={5}
                maxLength={3000}
              />
            </div>
          </FormSection>

          <FormSection
            number="05"
            title="Roster Recommendation"
            description="Select the captain's recommendation after reviewing the full tryout."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <RecommendationCard
                title="Recommend"
                description="Strong candidate for the roster."
                selected={form.recommendation === 'recommend'}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    recommendation: 'recommend',
                  }))
                }
              />

              <RecommendationCard
                title="Consider"
                description="Needs another review or additional tryout."
                selected={form.recommendation === 'consider'}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    recommendation: 'consider',
                  }))
                }
              />

              <RecommendationCard
                title="Not Recommended"
                description="Not currently recommended for the roster."
                selected={form.recommendation === 'not-recommended'}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    recommendation: 'not-recommended',
                  }))
                }
              />
            </div>
          </FormSection>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-300 pt-8 sm:flex-row">
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#002142] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-[#004C97] px-8 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#002142] focus:outline-none focus:ring-4 focus:ring-[#FFC61E]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-[#002142]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            San Jac Ravens Esports
          </p>
          <p className="mt-1 text-xs text-white/40">
            Captain Tryout Evaluation System
          </p>
        </div>
      </footer>
    </main>
  );
}

// Reusable section shell.
function FormSection({ number, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="font-black text-[#004C97]">{number}</span>

          <div>
            <h3 className="text-xl font-black uppercase text-[#002142]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

// Standard text/date input.
function InputField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#002142]">
        {label}
      </span>

      <input
        {...props}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-[#002142] outline-none transition focus:border-[#004C97] focus:ring-4 focus:ring-[#004C97]/10"
      />
    </label>
  );
}

// Standard select field.
function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#002142]">
        {label}
      </span>

      <select
        {...props}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-[#002142] outline-none transition focus:border-[#004C97] focus:ring-4 focus:ring-[#004C97]/10"
      >
        {children}
      </select>
    </label>
  );
}

// Standard multi-line notes field.
function TextAreaField({ label, rows = 4, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#002142]">
        {label}
      </span>

      <textarea
        {...props}
        rows={rows}
        className="w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-[#002142] outline-none transition focus:border-[#004C97] focus:ring-4 focus:ring-[#004C97]/10"
      />
    </label>
  );
}

// One 1-5 rating category.
function RatingRow({ label, description, value, onChange }) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-black text-[#002142]">{label}</p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div
        className="flex gap-2"
        role="group"
        aria-label={`${label} rating`}
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = Number(value) === score;

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              aria-pressed={selected}
              className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-black transition ${
                selected
                  ? 'border-[#004C97] bg-[#004C97] text-white'
                  : 'border-slate-300 bg-white text-[#002142] hover:border-[#004C97]'
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Final roster recommendation.
function RecommendationCard({ title, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-32 rounded-lg border-2 p-5 text-left transition ${
        selected
          ? 'border-[#FFC61E] bg-[#002142] text-white'
          : 'border-slate-200 bg-white text-[#002142] hover:border-[#004C97]'
      }`}
    >
      <p className="text-lg font-black uppercase">{title}</p>

      <p
        className={`mt-2 text-sm leading-5 ${
          selected ? 'text-white/70' : 'text-slate-500'
        }`}
      >
        {description}
      </p>
    </button>
  );
}
