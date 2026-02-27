import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0; // always fresh

async function getQueueData() {
  const supabase = createAdminClient();
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        order: (c: string, opts?: Record<string, unknown>) => {
          limit: (n: number) => Promise<{ data: unknown[] | null }>;
        };
      };
    };
  };

  const [disputes, tropes, rules, critics] = await Promise.all([
    db.from("trope_disputes").select("id, analysis_id, trope_id, reason, status, created_at").order("created_at", { ascending: false }).limit(25),
    db.from("trope_submissions").select("id, name, category, severity, rationale, status, created_at").order("created_at", { ascending: false }).limit(25),
    db.from("rule_suggestions").select("id, rule, suggestion, rationale, status, created_at").order("created_at", { ascending: false }).limit(25),
    db.from("critic_applications").select("id, user_id, bio, sample_url, status, created_at").order("created_at", { ascending: false }).limit(25),
  ]);

  return {
    disputes: (disputes.data ?? []) as Array<{ id: string; analysis_id: string; trope_id: string; reason: string; status: string; created_at: string }>,
    tropes: (tropes.data ?? []) as Array<{ id: string; name: string; category: string; severity: string; rationale: string; status: string; created_at: string }>,
    rules: (rules.data ?? []) as Array<{ id: string; rule: string; suggestion: string; rationale: string; status: string; created_at: string }>,
    critics: (critics.data ?? []) as Array<{ id: string; user_id: string; bio: string; sample_url: string; status: string; created_at: string }>,
  };
}

export default async function AdminPage() {
  const user = await requireAdmin().catch(() => null);
  if (!user) redirect("/");

  const queue = await getQueueData();

  const pendingCount =
    queue.disputes.filter((d) => d.status === "pending").length +
    queue.tropes.filter((t) => t.status === "pending").length +
    queue.rules.filter((r) => r.status === "pending").length +
    queue.critics.filter((c) => c.status === "pending").length;

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}>
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>ADMIN CONSOLE</h1>
            <p style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>管理コンソール</p>
          </div>
          {pendingCount > 0 && (
            <span className="px-4 py-2 text-sm rounded-full" style={{ backgroundColor: "rgba(230, 55, 30, 0.15)", color: "var(--color-vermillion-500)", borderRadius: "9999px" }}>
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <a href="/admin/bulk-import" className="flex flex-col gap-1 p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>BULK</span>
            <span className="text-sm" style={{ color: "var(--color-washi-100)" }}>Import runner</span>
          </a>
          <a href="/transparency" className="flex flex-col gap-1 p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>VIEW</span>
            <span className="text-sm" style={{ color: "var(--color-washi-100)" }}>Transparency</span>
          </a>
          <a href="/leaderboard" className="flex flex-col gap-1 p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>VIEW</span>
            <span className="text-sm" style={{ color: "var(--color-washi-100)" }}>Leaderboard</span>
          </a>
          <a href="/glossary" className="flex flex-col gap-1 p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>VIEW</span>
            <span className="text-sm" style={{ color: "var(--color-washi-100)" }}>Glossary</span>
          </a>
        </div>

        {/* Trope Disputes */}
        <QueueSection title="Trope Disputes" jp="トロープ異議" count={queue.disputes.filter(d => d.status === "pending").length}>
          {queue.disputes.length === 0 ? (
            <EmptyState text="No disputes" />
          ) : (
            queue.disputes.map((d) => (
              <QueueItem key={d.id} status={d.status} title={`Dispute: ${d.trope_id}`} body={d.reason} date={d.created_at}
                actionPath={`/api/admin/disputes/${d.id}`} />
            ))
          )}
        </QueueSection>

        {/* Trope Submissions */}
        <QueueSection title="Trope Submissions" jp="トロープ提案" count={queue.tropes.filter(t => t.status === "pending").length}>
          {queue.tropes.length === 0 ? (
            <EmptyState text="No trope submissions" />
          ) : (
            queue.tropes.map((t) => (
              <QueueItem key={t.id} status={t.status} title={`${t.name} [${t.category}]`} body={t.rationale} date={t.created_at}
                actionPath={`/api/admin/tropes/${t.id}`} meta={`severity: ${t.severity}`} />
            ))
          )}
        </QueueSection>

        {/* Rule Suggestions */}
        <QueueSection title="Rule Suggestions" jp="ルール変更提案" count={queue.rules.filter(r => r.status === "pending").length}>
          {queue.rules.length === 0 ? (
            <EmptyState text="No rule suggestions" />
          ) : (
            queue.rules.map((r) => (
              <QueueItem key={r.id} status={r.status} title={`${r.rule}: ${r.suggestion.slice(0, 60)}…`} body={r.rationale} date={r.created_at}
                actionPath={`/api/admin/rules/${r.id}`} />
            ))
          )}
        </QueueSection>

        {/* Critic Applications */}
        <QueueSection title="Critic Applications" jp="批評家申請" count={queue.critics.filter(c => c.status === "pending").length}>
          {queue.critics.length === 0 ? (
            <EmptyState text="No applications" />
          ) : (
            queue.critics.map((c) => (
              <QueueItem key={c.id} status={c.status} title={`User ${c.user_id.slice(0, 8)}`} body={c.bio} date={c.created_at}
                actionPath={`/api/admin/critics/${c.id}`} meta={c.sample_url} />
            ))
          )}
        </QueueSection>
      </div>
    </main>
  );
}

function QueueSection({ title, jp, count, children }: { title: string; jp: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b" style={{ borderColor: "var(--color-ink-700)" }}>
        <h2 className="text-xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>{title}</h2>
        <span className="text-xs" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>{jp}</span>
        {count > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(230,55,30,0.15)", color: "var(--color-vermillion-500)", borderRadius: "9999px" }}>{count}</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function QueueItem({ status, title, body, date, actionPath, meta }: { status: string; title: string; body: string; date: string; actionPath: string; meta?: string }) {
  const isPending = status === "pending";
  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: isPending ? "rgba(230,55,30,0.2)" : "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--color-washi-100)" }}>{title}</p>
          {meta && <p className="text-xs mb-1" style={{ color: "var(--color-vermillion-400)", fontFamily: "var(--font-mono)" }}>{meta}</p>}
          <p className="text-xs line-clamp-2 mt-1" style={{ color: "var(--color-washi-400)" }}>{body}</p>
          <p className="text-[10px] mt-2" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)", opacity: 0.5 }}>
            {new Date(date).toLocaleDateString()} · {status}
          </p>
        </div>
        {isPending && (
          <div className="flex gap-2 shrink-0">
            <form action={`${actionPath}/approve`} method="POST">
              <button type="submit" className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: "rgba(111,207,151,0.4)", color: "#6FCF97", borderRadius: "9999px" }}>
                Approve
              </button>
            </form>
            <form action={`${actionPath}/reject`} method="POST">
              <button type="submit" className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: "rgba(230,55,30,0.3)", color: "var(--color-vermillion-500)", borderRadius: "9999px" }}>
                Reject
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-6 rounded-xl border" style={{ borderColor: "var(--color-ink-700)", borderRadius: "var(--radius-md)" }}>
      <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>{text}</p>
    </div>
  );
}
