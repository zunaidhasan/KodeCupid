import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarHeart, Check, CheckCheck, Clock, Flag, ImagePlus, Lock, MoreVertical, Send, ShieldBan, Unlink, Video, X } from "lucide-react";
import type { Message } from "@/types";
import { EXTEND_MATCH_COINS } from "@/data/catalog";
import { promptById } from "@/data/icebreakers";
import { cn } from "@/lib/cn";
import { fileToDataUrl } from "@/lib/image";
import { formatDate, formatDateTime } from "@/lib/format";
import { scheduleCompatibility } from "@/lib/schedule";
import { chatService, setActiveConversation, typingStore } from "@/services/chatService";
import { matchService } from "@/services/matchService";
import { videoProvider } from "@/services/providers";
import { conversationState, getMember, matchBetween, otherId } from "@/services/selectors";
import { useApp, useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ScheduleBadge } from "@/components/Badges";
import { UpgradePrompt } from "@/features/billing/UpgradePrompt";
import { MicroDateScheduler } from "@/features/schedule/MicroDateScheduler";
import { ReportModal } from "@/features/safety/ReportModal";
import { BlockModal } from "@/features/safety/BlockModal";

export function ChatPage() {
  const { id = "" } = useParams();
  const me = useMe();
  const { db, entitlements, settings, wallet } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const conv = db.conversations.find((c) => c.id === id && c.participantIds.includes(me.user.id));
  const other = conv ? getMember(db, otherId(conv, me.user.id)) : undefined;
  useDocumentTitle(other ? `Chat with ${other.profile.displayName}` : "Chat");

  const messages = useMemo(() => db.messages.filter((m) => m.conversationId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [db.messages, id]);
  const typing = useSyncExternalStore(typingStore.subscribe, () => typingStore.isTyping(id));
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reportMsg, setReportMsg] = useState<Message | null | "profile">(null);
  const [block, setBlock] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [video, setVideo] = useState<"off" | "upgrade" | "call">("off");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setActiveConversation(id); return () => setActiveConversation(null); }, [id]);
  useEffect(() => { if (conv) chatService.markRead(id, me.user.id); }, [id, messages.length, conv, me.user.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, typing]);

  if (!conv || !other) return <div className="p-6"><EmptyState icon="💬" title="Conversation not found" description="It may have been removed or you may have unmatched." action={<Link to="/app/matches" className={buttonStyles()}>Back to matches</Link>} /></div>;

  const state = conversationState(db, conv);
  const match = matchBetween(db, me.user.id, other.user.id);
  const first = other.profile.displayName.replace(/^Dr\.\s*/, "").split(" ")[0];
  const compat = scheduleCompatibility(me.professional, other.professional);
  const locked = state.kind === "expired" || state.kind === "prematch" || !entitlements.canChat;
  const myCount = messages.filter((m) => m.senderId === me.user.id).length;
  const ice = other.profile.icebreakers[0] && promptById(other.profile.icebreakers[0].promptId)?.text;
  const suggestions = [ice && `${ice}`, "How was your shift today?", "What's your go-to post-shift snack?"].filter(Boolean) as string[];

  const send = async () => {
    if ((!text.trim() && !image) || sending || locked) return;
    setSending(true);
    try { await chatService.sendMessage(id, me.user.id, { body: text, imageUrl: image || undefined }); setText(""); setImage(""); }
    catch (e) { toast.error("Message not sent", (e as Error).message); } finally { setSending(false); }
  };
  const startVideo = async () => {
    if (!settings.videoEnabled) { toast.error("Video chat is turned off", "Turn it back on in Safety Center → Chat settings."); return; }
    if (!entitlements.canVideo) { setVideo("upgrade"); return; }
    setVideo("call");
    await videoProvider.startCall(id);
  };

  let lastDay = "";
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col bg-white md:border-x md:border-cream-200">
      <header className="flex items-center gap-3 border-b border-cream-200 bg-white px-3 py-3 sm:px-4">
        <button onClick={() => navigate("/app/matches")} aria-label="Back to matches" className="rounded-full p-2 hover:bg-cream-100"><ArrowLeft className="h-5 w-5" /></button>
        <Link to={`/app/profile/${other.user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={other.profile.photos[0]?.url} name={other.profile.displayName} verified={other.verification.status === "verified"} />
          <span className="min-w-0"><span className="block truncate font-semibold">{other.profile.displayName}</span><span className="block truncate text-xs text-ink-mute">{other.professional.jobTitle}</span></span>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={startVideo} aria-label="Start video chat" className="relative rounded-full p-2.5 text-brand-700 hover:bg-brand-50"><Video className="h-5 w-5" />{!entitlements.canVideo && <Lock className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white text-ink" />}</button>
          {match && <button onClick={() => setDateOpen(true)} aria-label="Plan a micro-date" className="rounded-full p-2.5 text-coral-600 hover:bg-coral-50"><CalendarHeart className="h-5 w-5" /></button>}
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="More options" className="rounded-full p-2.5 hover:bg-cream-100"><MoreVertical className="h-5 w-5" /></button>
            {menu && (
              <div role="menu" className="absolute right-0 top-12 z-20 w-52 animate-pop overflow-hidden rounded-2xl border border-cream-200 bg-white py-1 shadow-card" onMouseLeave={() => setMenu(false)}>
                {[
                  { icon: Flag, label: "Report user", on: () => setReportMsg("profile") },
                  { icon: ShieldBan, label: "Block user", on: () => setBlock(true) },
                  ...(match ? [{ icon: Unlink, label: "Unmatch", on: async () => { await matchService.unmatch(match.id); toast.success("Unmatched"); navigate("/app/matches"); } }] : []),
                ].map(({ icon: I, label, on }) => <button key={label} role="menuitem" onClick={() => { setMenu(false); on(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium hover:bg-cream-100"><I className="h-4 w-4" aria-hidden />{label}</button>)}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-cream-100 bg-cream/60 px-4 py-2 text-xs"><ScheduleBadge compat={compat} size="sm" /><span className="text-ink-mute">{compat.reason}</span></div>

      {state.kind === "expiring" && <div role="status" className="flex items-center gap-2 bg-coral-50 px-4 py-2.5 text-sm text-coral-800"><Clock className="h-4 w-4 shrink-0" aria-hidden /><span>This match expires in <strong>{state.label}</strong>. Send a message — once you've both chatted, it stays open.</span></div>}
      {state.kind === "prematch" && <div role="status" className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-sm text-amber-900"><Lock className="h-4 w-4 shrink-0" aria-hidden />Pre-match message sent. Chat opens when you both like each other.</div>}

      <div className="flex-1 space-y-2 overflow-y-auto bg-cream/40 px-4 py-4" role="log" aria-live="polite" aria-label={`Conversation with ${other.profile.displayName}`}>
        {messages.length === 0 && <p className="py-8 text-center text-sm text-ink-mute">You matched with {first}! Break the ice 👇</p>}
        {messages.map((m) => {
          const mine = m.senderId === me.user.id;
          const day = formatDate(m.createdAt, { weekday: "short", month: "short", day: "numeric" });
          const sep = day !== lastDay; lastDay = day;
          return (
            <div key={m.id}>
              {sep && <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{day}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[82%] space-y-1", mine ? "items-end" : "items-start")}>
                  <div className={cn("rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm", mine ? "rounded-br-md bg-brand-700 text-white" : "rounded-bl-md bg-white text-ink", m.removedByModerator && "italic opacity-70")}>
                    {m.removedByModerator ? "This message was removed by a moderator." : <>
                      {m.imageUrl && <img src={m.imageUrl} alt="Shared in chat" className="mb-1.5 max-h-60 rounded-2xl" />}
                      {m.body}
                    </>}
                  </div>
                  <div className={cn("flex items-center gap-2 px-1 text-[11px] text-ink-mute", mine && "justify-end")}>
                    <time dateTime={m.createdAt} title={formatDateTime(m.createdAt)}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                    {mine && (m.readAt ? <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600"><CheckCheck className="h-3.5 w-3.5" aria-hidden />Read</span> : <span className="inline-flex items-center gap-0.5"><Check className="h-3.5 w-3.5" aria-hidden />Delivered</span>)}
                    {!mine && !m.removedByModerator && <button onClick={() => setReportMsg(m)} className="inline-flex items-center gap-0.5 hover:text-coral-600" aria-label="Report this message"><Flag className="h-3 w-3" aria-hidden />Report</button>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start" role="status" aria-label={`${first} is typing`}>
            <div className="flex items-center gap-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-sm">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce-dot rounded-full bg-ink-mute" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {state.kind === "expired" ? (
        <div className="space-y-3 border-t border-cream-200 bg-white p-4 text-center">
          <p className="font-semibold">This match has expired</p>
          <p className="text-sm text-ink-soft">Extend it for another {settings.matchExpiryDays} days with {EXTEND_MATCH_COINS} coins (you have {wallet.coins}).</p>
          <div className="flex justify-center gap-2"><Button variant="accent" onClick={async () => { const r = match ? await matchService.extendMatch(me.user.id, match.id) : { ok: false, reason: "Match not found" }; r.ok ? toast.success("Match extended") : toast.error("Couldn't extend", r.reason); }}>Extend match</Button><Link to="/app/coins" className={buttonStyles({ variant: "secondary" })}>Get coins</Link></div>
        </div>
      ) : !entitlements.canChat && state.kind !== "prematch" ? (
        <div className="border-t border-cream-200 bg-white p-4"><UpgradePrompt compact title="Upgrade to send messages" description="Real-time chat is included with Silver and Premium." /></div>
      ) : state.kind === "prematch" ? null : (
        <div className="border-t border-cream-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          {myCount === 0 && <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Conversation starters">{suggestions.map((s) => <button key={s} onClick={() => setText(s)} className="max-w-xs shrink-0 truncate rounded-full border border-coral-200 bg-coral-50 px-3.5 py-1.5 text-xs font-semibold text-coral-700 hover:bg-coral-100" title={s}>💡 {s}</button>)}</div>}
          {image && <div className="relative mb-2 inline-block"><img src={image} alt="Image to send" className="h-20 rounded-2xl" /><button onClick={() => setImage("")} aria-label="Remove image" className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white"><X className="h-3 w-3" /></button></div>}
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Attach image" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { setImage(await fileToDataUrl(f, 640)); } catch (err) { toast.error("Image not added", (err as Error).message); } }} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach image" className="rounded-full p-3 text-ink-soft hover:bg-cream-100"><ImagePlus className="h-5 w-5" /></button>
            <label htmlFor="chat-input" className="sr-only">Message {first}</label>
            <textarea id="chat-input" rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Message ${first}…`} className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-cream-200 bg-cream/60 px-4 py-3 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100" />
            <Button type="submit" variant="accent" size="icon" loading={sending} disabled={!text.trim() && !image} aria-label="Send message" className="h-12 w-12 shrink-0"><Send className="h-5 w-5" /></Button>
          </form>
        </div>
      )}

      {reportMsg && <ReportModal open onClose={() => setReportMsg(null)} reporterId={me.user.id} target={other} message={reportMsg === "profile" ? undefined : reportMsg} onBlocked={() => navigate("/app/matches")} />}
      <BlockModal open={block} onClose={() => setBlock(false)} meId={me.user.id} target={other} onBlocked={() => navigate("/app/matches")} />
      {match && <MicroDateScheduler open={dateOpen} onClose={() => setDateOpen(false)} me={me} other={other} matchId={match.id} />}
      <Modal open={video === "upgrade"} onClose={() => setVideo("off")} title="Video chat is a Premium feature"><UpgradePrompt compact title="Meet face to face" description="Premium includes video chat when it launches. Prototype tip: switch to Premium from the Subscription page." cta="See Premium" /></Modal>
      <Modal open={video === "call"} onClose={() => setVideo("off")} title="Video call" hideTitle size="sm">
        <div className="text-center">
          <Avatar src={other.profile.photos[0]?.url} name={other.profile.displayName} size="xl" className="mx-auto" />
          <p className="mt-3 font-display text-xl font-semibold">{other.profile.displayName}</p>
          <Badge tone="gold" className="mt-2">Mock call screen</Badge>
          <p className="mt-4 text-sm text-ink-soft"><strong>Video calling coming soon.</strong> We'll let you know the moment it's ready.</p>
          <Button className="mt-5" variant="danger" onClick={() => setVideo("off")}>End call</Button>
        </div>
      </Modal>
    </div>
  );
}
