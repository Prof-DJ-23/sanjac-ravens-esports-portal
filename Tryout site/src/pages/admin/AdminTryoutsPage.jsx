import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, describeError } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthProvider';

/*
|--------------------------------------------------------------------------
| Admin - Tryout Submissions
|--------------------------------------------------------------------------
|
| Admin-only review page for captain tryout evaluations.
|
| Features:
| - Reads tryout_submissions from Supabase.
| - Filters by game, recommendation, or text.
| - Downloads the CURRENT filtered results as a CSV file.
| - Excel opens the CSV directly as a spreadsheet.
|
| No extra npm package is required for Excel export.
|--------------------------------------------------------------------------
*/

const RECOMMENDATION_LABELS = {
  recommend: 'Recommend',
  consider: 'Consider',
  'not-recommended': 'Not Recommended',
};

export default function AdminTryoutsPage() {
  const { role, isActive } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gameFilter, setGameFilter] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('');
  const [search, setSearch] = useState('');

  // --------------------------------------------------------------------------
  // Load all submissions.
  // RLS allows this SELECT only when the signed-in portal profile is admin.
  // --------------------------------------------------------------------------
  const loadTryouts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tryout_submissions')
        .select('*')
        .order('tryout_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setRows(data || []);
    } catch (err) {
      setError(
        describeError
          ? describeError(err)
          : err?.message || 'Unable to load tryout submissions.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive && role === 'admin') {
      loadTryouts();
    } else {
      setLoading(false);
    }
  }, [isActive, role, loadTryouts]);

  // Build the game filter from the actual submitted records.
  const games = useMemo(
    () => [...new Set(rows.map((row) => row.game).filter(Boolean))].sort(),
    [rows],
  );

  // Filter on the client for quick admin review.
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (gameFilter && row.game !== gameFilter) {
        return false;
      }

      if (
        recommendationFilter
        && row.recommendation !== recommendationFilter
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        row.player_first_name,
        row.player_last_initial,
        row.discord_name,
        row.in_game_name,
        row.evaluator,
        row.primary_role,
        row.current_rank,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [rows, gameFilter, recommendationFilter, search]);

  // --------------------------------------------------------------------------
  // Excel-compatible CSV export.
  //
  // Why CSV:
  // - Excel opens it directly.
  // - No extra dependency is required.
  // - The UTF-8 BOM keeps names/special characters readable in Excel.
  // --------------------------------------------------------------------------
  const downloadExcelCsv = () => {
    const columns = [
      ['Submitted At', 'created_at'],
      ['Tryout Date', 'tryout_date'],
      ['Game / Team', 'game'],
      ['Captain / Evaluator', 'evaluator'],
      ['Player First Name', 'player_first_name'],
      ['Player Last Initial', 'player_last_initial'],
      ['Discord Name', 'discord_name'],
      ['In-Game Name', 'in_game_name'],
      ['Primary Role', 'primary_role'],
      ['Current Rank', 'current_rank'],
      ['Mechanics', 'mechanics'],
      ['Game Knowledge', 'game_knowledge'],
      ['Communication', 'communication'],
      ['Teamwork', 'teamwork'],
      ['Adaptability', 'adaptability'],
      ['Coachability', 'coachability'],
      ['Overall Performance', 'overall_performance'],
      ['Strengths', 'strengths'],
      ['Areas for Improvement', 'improvement_areas'],
      ['Captain Notes', 'captain_notes'],
      ['Recommendation', 'recommendation'],
    ];

    // Escape values according to CSV rules so commas, quotes, and line breaks
    // inside captain notes do not break the spreadsheet.
    const escapeCsv = (value) => {
      const text = value == null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = columns.map(([label]) => escapeCsv(label)).join(',');

    const body = filteredRows.map((row) =>
      columns
        .map(([label, key]) => {
          if (key === 'recommendation') {
            return escapeCsv(
              RECOMMENDATION_LABELS[row[key]] || row[key] || '',
            );
          }

          return escapeCsv(row[key]);
        })
        .join(','),
    );

    // Add a UTF-8 BOM so Microsoft Excel recognizes the encoding.
    const csv = `\uFEFF${[header, ...body].join('\r\n')}`;

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const today = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `San_Jac_Ravens_Tryouts_${today}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // Extra frontend check. The real protection is the Supabase RLS policy.
  if (!isActive || role !== 'admin') {
    return (
      <main className="min-h-screen bg-[#F5F7FA] px-6 py-12 text-[#002142]">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black uppercase">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tryout submissions are available only to portal administrators.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#002142]">
      <header className="border-b-4 border-[#FFC61E] bg-[#002142] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFC61E]">
            San Jac Ravens Esports · Admin
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black uppercase">
                Tryout Submissions
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Review captain evaluations and download the current results
                as an Excel-compatible spreadsheet.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadExcelCsv}
              disabled={filteredRows.length === 0}
              className="rounded-md bg-[#FFC61E] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#002142] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Excel CSV
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filters */}
        <section className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase">
              Search
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Player, Discord, captain..."
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#004C97]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase">
              Game
            </span>
            <select
              value={gameFilter}
              onChange={(event) => setGameFilter(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#004C97]"
            >
              <option value="">All games</option>
              {games.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase">
              Recommendation
            </span>
            <select
              value={recommendationFilter}
              onChange={(event) =>
                setRecommendationFilter(event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#004C97]"
            >
              <option value="">All recommendations</option>
              <option value="recommend">Recommend</option>
              <option value="consider">Consider</option>
              <option value="not-recommended">Not Recommended</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadTryouts}
              className="w-full rounded-md border border-[#004C97] bg-white px-4 py-2.5 text-sm font-black uppercase text-[#004C97] transition hover:bg-[#004C97] hover:text-white"
            >
              Refresh
            </button>
          </div>
        </section>

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">
            {filteredRows.length} submission
            {filteredRows.length === 1 ? '' : 's'}
          </p>
        </div>

        {error && (
          <div className="mb-6 border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            Loading tryout submissions...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            No tryout submissions match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#002142] text-white">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">Recommendation</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-200 align-top"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.tryout_date}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold">
                        {row.player_first_name} {row.player_last_initial}.
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.discord_name}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      {row.game}
                    </td>

                    <td className="px-4 py-3">
                      {row.primary_role}
                    </td>

                    <td className="px-4 py-3">
                      {row.evaluator}
                    </td>

                    <td className="px-4 py-3 font-black">
                      {row.overall_performance}/5
                    </td>

                    <td className="px-4 py-3">
                      {RECOMMENDATION_LABELS[row.recommendation]
                        || row.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
