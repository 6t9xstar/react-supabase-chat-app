/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_DGaccwLc.mjs';
import 'piccolore';
import 'html-escaper';
import { $ as $$Layout } from '../chunks/Layout_BDwF-l-k.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import React, { useRef, useEffect, useCallback, useState, memo, useMemo, Component } from 'react';
import { s as supabase, a as signOut, g as getCurrentUser, o as onAuthStateChange } from '../chunks/auth_BIeveEvo.mjs';
import { Sun, Moon, Pin, Archive, Check, MessageSquare, Loader2, Search, X, Bell, BellOff, Settings, LogOut, MessageCircle, ChevronRight, Users, ArchiveRestore, Edit, ChevronLeft, Timer, Info, FileCode, FileArchive, FileText, FileSpreadsheet, Music, Film, Image, File as File$1, Download, Pause, Play, Shield, Lock, ExternalLink, Trash2, Forward, CheckCheck, AlertCircle, Reply, Pencil, PinOff, ChevronDown, Paperclip, Camera, Smile, ArrowUp, Mic, ShieldOff, CheckCircle, XCircle, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
export { renderers } from '../renderers.mjs';

async function getProfile(id) {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
}
async function searchProfiles(query, excludeUserId) {
  let q = supabase.from("profiles").select("id, email, full_name, avatar_url, role, is_active, created_at").eq("is_active", true).or(`full_name.ilike.%${query}%,email.ilike.%${query}%`).limit(20);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q;
  return data ?? [];
}
async function getAllActiveProfiles() {
  const { data } = await supabase.from("profiles").select("*").eq("is_active", true).order("full_name");
  return data ?? [];
}
async function updateLastSeen(id) {
  const { error } = await supabase.from("profiles").update({ last_seen_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
  if (error) console.error("Failed to update last_seen_at:", error);
}
async function updateProfile(id, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

function isNotificationSupported() {
  return "Notification" in window;
}
function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}
async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

async function fetchSenderName(senderId) {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", senderId).single();
  return data?.full_name ?? "Someone";
}
function useNotifications({ userId, activeConversationId, autoRequest = false }) {
  const permissionRequested = useRef(false);
  const convIdRef = useRef(activeConversationId);
  useEffect(() => {
    convIdRef.current = activeConversationId;
  }, [activeConversationId]);
  const requestPermission = useCallback(async () => {
    const permission = getNotificationPermission();
    if (permission === "granted" || permission === "denied" || permission === "unsupported") {
      return permission === "granted";
    }
    try {
      const granted = await requestNotificationPermission();
      if (granted) permissionRequested.current = true;
      return granted;
    } catch (e) {
      console.error("Notification permission request failed:", e);
      return false;
    }
  }, []);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data: memberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
      if (cancelled) return;
      const convIds = memberships?.map((m) => m.conversation_id) ?? [];
      if (convIds.length === 0) return;
      const channel = supabase.channel("notifications").on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=in.(${convIds.join(",")})`
        },
        async (payload) => {
          if (cancelled) return;
          const msg = payload.new;
          if (msg.sender_id === userId) return;
          if (msg.conversation_id === convIdRef.current && !document.hidden) return;
          const permission = getNotificationPermission();
          if (permission === "denied" || permission === "unsupported") return;
          if (permission === "default") {
            if (!autoRequest || permissionRequested.current) return;
            permissionRequested.current = true;
            const granted = await requestPermission();
            if (!granted) return;
          }
          const senderName = await fetchSenderName(msg.sender_id);
          if (cancelled) return;
          try {
            const notification = new Notification(senderName, {
              body: msg.content || "Sent an attachment",
              icon: "/favicon.svg",
              tag: msg.conversation_id,
              data: { conversationId: msg.conversation_id }
            });
            notification.onclick = () => {
              window.focus();
              window.dispatchEvent(
                new CustomEvent("notification-click", { detail: msg.conversation_id })
              );
              notification.close();
            };
          } catch (e) {
            console.error("Failed to show notification:", e);
          }
        }
      ).subscribe();
      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    })();
  }, [userId, autoRequest, requestPermission]);
  return { requestPermission };
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  const colors = { light: "#FFFFFF", dark: "#000000" };
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", colors[theme]);
}
function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
    }
  }, [theme]);
  const toggle = useCallback(() => {
    setTheme((prev) => prev === "dark" ? "light" : "dark");
  }, []);
  return { theme, toggle };
}

async function findExistingDirectConversation(userA, userB) {
  const { data: aConvs } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userA);
  if (!aConvs?.length) return null;
  const aIds = aConvs.map((c) => c.conversation_id);
  const { data: directConvs } = await supabase.from("conversations").select("id").in("id", aIds).eq("type", "direct");
  if (!directConvs?.length) return null;
  const directIds = directConvs.map((c) => c.id);
  const { data: shared } = await supabase.from("conversation_members").select("conversation_id").in("conversation_id", directIds).eq("user_id", userB).limit(1);
  return shared?.[0]?.conversation_id ?? null;
}
async function getConversations(userId) {
  const { data: memberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
  if (!memberships?.length) return [];
  const ids = memberships.map((m) => m.conversation_id);
  const { data: conversations } = await supabase.from("conversations").select("*").in("id", ids).order("updated_at", { ascending: false });
  if (!conversations) return [];
  const [lastMsgMap, otherUserMap, unreadMap] = await Promise.all([
    getLastMessagesMap(ids),
    getOtherUsersMap(ids, userId),
    getUnreadCountsMap(userId)
  ]);
  return conversations.map((conv) => ({
    ...conv,
    last_message: lastMsgMap.get(conv.id) ?? null,
    unread_count: unreadMap.get(conv.id) ?? 0,
    other_user: conv.type === "direct" ? otherUserMap.get(conv.id) ?? null : null
  }));
}
async function getUnreadCountsMap(userId) {
  try {
    const { data, error } = await supabase.rpc("get_unread_counts", { p_user_id: userId });
    if (error) throw error;
    return new Map((data ?? []).map((r) => [r.conversation_id, r.unread_count]));
  } catch (e) {
    console.error("get_unread_counts failed:", e);
    return /* @__PURE__ */ new Map();
  }
}
async function getLastMessagesMap(convIds) {
  const map = /* @__PURE__ */ new Map();
  if (!convIds.length) return map;
  const { data, error } = await supabase.rpc("get_last_messages", {
    p_conversation_ids: convIds
  });
  if (error) {
    console.error("get_last_messages failed:", error);
    return map;
  }
  for (const msg of data ?? []) {
    map.set(msg.conversation_id, msg);
  }
  return map;
}
async function getOtherUsersMap(convIds, userId) {
  const map = /* @__PURE__ */ new Map();
  const { data: members } = await supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", convIds).neq("user_id", userId);
  if (!members?.length) return map;
  const otherUserIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherUserIds);
  if (profiles) {
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    for (const m of members) {
      const profile = profileMap.get(m.user_id);
      if (profile) map.set(m.conversation_id, profile);
    }
  }
  return map;
}
async function findOrCreateDirectConversation(userA, userB) {
  const existing = await findExistingDirectConversation(userA, userB);
  if (existing) return existing;
  const { data: conv, error } = await supabase.from("conversations").insert({ type: "direct", created_by: userA }).select().single();
  if (error || !conv) throw error ?? new Error("Failed to create conversation");
  await supabase.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: userA },
    { conversation_id: conv.id, user_id: userB }
  ]);
  return conv.id;
}
async function createGroupConversation(name, createdBy, memberIds) {
  const { data: conv, error } = await supabase.from("conversations").insert({ type: "group", name, created_by: createdBy }).select().single();
  if (error || !conv) throw error ?? new Error("Failed to create group");
  const allMembers = [.../* @__PURE__ */ new Set([createdBy, ...memberIds])];
  await supabase.from("conversation_members").insert(
    allMembers.map((userId) => ({ conversation_id: conv.id, user_id: userId }))
  );
  return conv.id;
}
async function getConversationMembers(conversationId) {
  const { data } = await supabase.from("conversation_members").select("user_id, role, profiles!inner(id, full_name, avatar_url)").eq("conversation_id", conversationId);
  return data ?? [];
}
async function updateMemberRole(conversationId, userId, role) {
  const { error } = await supabase.from("conversation_members").update({ role }).eq("conversation_id", conversationId).eq("user_id", userId);
  if (error) throw error;
}
async function addMember(conversationId, userId) {
  const { error } = await supabase.from("conversation_members").insert({ conversation_id: conversationId, user_id: userId });
  if (error) throw error;
}
async function removeMember(conversationId, userId) {
  const { error } = await supabase.from("conversation_members").delete().eq("conversation_id", conversationId).eq("user_id", userId);
  if (error) throw error;
}
async function renameGroup(conversationId, name) {
  const { error } = await supabase.from("conversations").update({ name, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", conversationId);
  if (error) throw error;
}

const STORAGE_KEY$2 = "apex-chat-pinned";
function getPinnedConversationIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY$2);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function togglePinnedConversation(convId) {
  const pinned = getPinnedConversationIds();
  const idx = pinned.indexOf(convId);
  if (idx >= 0) {
    pinned.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY$2, JSON.stringify(pinned));
    return false;
  } else {
    pinned.unshift(convId);
    localStorage.setItem(STORAGE_KEY$2, JSON.stringify(pinned));
    return true;
  }
}
function isPinned(convId) {
  return getPinnedConversationIds().includes(convId);
}

function sortPinnedFirst(convs) {
  const pinnedIds = new Set(getPinnedConversationIds());
  return [
    ...convs.filter((c) => pinnedIds.has(c.id)),
    ...convs.filter((c) => !pinnedIds.has(c.id))
  ];
}
function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getConversations(userId);
      setConversations(sortPinnedFirst(data));
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  const silentReload = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getConversations(userId);
      setConversations(sortPinnedFirst(data));
    } catch (e) {
      console.error("Silent reload failed:", e);
    }
  }, [userId]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getConversations(userId);
        if (mounted) setConversations(sortPinnedFirst(data));
      } catch (e) {
        console.error("Failed to load conversations:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let reloadTimer = null;
    let channel = null;
    const scheduleSilentReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        silentReload();
      }, 1e3);
    };
    (async () => {
      const { data: memberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
      if (cancelled) return;
      const convIds = memberships?.map((m) => m.conversation_id) ?? [];
      if (convIds.length === 0) return;
      channel = supabase.channel("sidebar").on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=in.(${convIds.join(",")})`
        },
        () => {
          scheduleSilentReload();
        }
      ).on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          scheduleSilentReload();
        }
      ).on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`
        },
        () => {
          silentReload();
        }
      ).subscribe();
    })();
    return () => {
      cancelled = true;
      if (reloadTimer) clearTimeout(reloadTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, silentReload]);
  return { conversations, loading, refresh: load };
}

function ThemeToggle({ theme, onToggle }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: onToggle,
      className: "ios-press flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-ios-secondary_label-light hover:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark",
      title: theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode",
      "aria-label": theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode",
      children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "h-[18px] w-[18px]", strokeWidth: 2.25 }) : /* @__PURE__ */ jsx(Moon, { className: "h-[18px] w-[18px]", strokeWidth: 2.25 })
    }
  );
}

const sizeMap$1 = {
  xs: "h-6 w-6 text-[10px] rounded-[6px]",
  sm: "h-8 w-8 text-xs rounded-[8px]",
  md: "h-10 w-10 text-sm rounded-[10px]",
  lg: "h-14 w-14 text-base rounded-[14px]",
  xl: "h-20 w-20 text-xl rounded-[18px]",
  "2xl": "h-28 w-28 text-3xl rounded-[24px]"
};
const dotMap = {
  xs: "h-1.5 w-1.5 border",
  sm: "h-2 w-2 border",
  md: "h-2.5 w-2.5 border-2",
  lg: "h-3 w-3 border-2",
  xl: "h-3.5 w-3.5 border-2",
  "2xl": "h-4 w-4 border-2"
};
const PALETTE = [
  "#FF9500",
  // orange
  "#FF3B30",
  // red
  "#AF52DE",
  // purple
  "#5856D6",
  // indigo
  "#007AFF",
  // blue
  "#34C759",
  // green
  "#5AC8FA",
  // teal
  "#FF2D55"
  // pink
];
function pickColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = hash * 31 + name.charCodeAt(i) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
function Avatar({ src, name, size = "md", online, ring, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const showImg = src && !imgError;
  const initials = name.trim().split(/\s+/).map((n) => n[0]?.toUpperCase() ?? "").filter(Boolean).slice(0, 2).join("") || "?";
  const bg = pickColor(name);
  return /* @__PURE__ */ jsxs("div", { className: `relative inline-flex shrink-0 ${sizeMap$1[size]} ${className}`, children: [
    showImg ? /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt: name,
        className: `h-full w-full object-cover ${sizeMap$1[size].split(" ").slice(-1)[0]}`,
        onError: () => setImgError(true),
        draggable: false
      }
    ) : /* @__PURE__ */ jsx(
      "div",
      {
        className: `flex h-full w-full items-center justify-center font-semibold text-white ${sizeMap$1[size].split(" ").slice(-1)[0]}`,
        style: { backgroundColor: bg },
        "aria-label": name,
        children: initials
      }
    ),
    online !== void 0 && /* @__PURE__ */ jsx(
      "span",
      {
        className: `absolute -bottom-0 -right-0 rounded-full border-ios-bg-light dark:border-ios-bg-dark ${online ? "bg-ios-green-light dark:bg-ios-green-dark" : "bg-ios-fill-light dark:bg-ios-fill-dark"} ${dotMap[size]}`
      }
    ),
    ring && /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-ios-blue-light dark:ring-ios-blue-dark ring-offset-2 ring-offset-ios-bg-light dark:ring-offset-ios-bg-dark" })
  ] });
}

function Badge({ count, className = "", variant = "pill" }) {
  if (count <= 0) return null;
  if (variant === "plain") {
    return /* @__PURE__ */ jsx("span", { className: `text-ios-blue-light dark:text-ios-blue-dark text-[15px] font-semibold ${className}`, children: count });
  }
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: `inline-flex min-w-[20px] items-center justify-center rounded-full bg-ios-red-light px-1.5 text-[12px] font-semibold leading-none text-white dark:bg-ios-red-dark ${className}`,
      children: count > 99 ? "99+" : count
    }
  );
}

function formatDistanceToNow(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMs < 0) return "just now";
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
function formatLastSeen(dateStr) {
  const date = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 864e5);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDate.getTime() === today.getTime()) {
    return `last seen today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return `last seen yesterday at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return `last seen ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
function formatDateSeparator(dateStr) {
  const date = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 864e5);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function formatTimeShort(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

const STORAGE_KEY$1 = "apex-chat-archived";
function getArchivedConversationIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY$1);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function toggleArchivedConversation(convId) {
  const archived = getArchivedConversationIds();
  const idx = archived.indexOf(convId);
  if (idx >= 0) {
    archived.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY$1, JSON.stringify(archived));
    return false;
  } else {
    archived.push(convId);
    localStorage.setItem(STORAGE_KEY$1, JSON.stringify(archived));
    return true;
  }
}
function isArchived(convId) {
  return getArchivedConversationIds().includes(convId);
}

function ConversationItem({ conversation, isActive, onSelect, currentUserId }) {
  const [pinned, setPinned] = useState(isPinned(conversation.id));
  const [archived, setArchived] = useState(isArchived(conversation.id));
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartX = useRef(0);
  const swipeStartOffset = useRef(0);
  const isDirect = conversation.type === "direct";
  const displayName = isDirect ? conversation.other_user?.full_name ?? "User" : conversation.name ?? "Unnamed Group";
  const lastMsg = conversation.last_message;
  const isOwnLastMsg = lastMsg?.sender_id === currentUserId;
  const previewText = lastMsg?.deleted_at ? "Message deleted" : lastMsg?.content ? lastMsg.content : lastMsg ? "📎 File message" : "No messages yet";
  const togglePin = () => {
    togglePinnedConversation(conversation.id);
    setPinned(!pinned);
  };
  const handlePinToggle = (e) => {
    e.stopPropagation();
    togglePin();
  };
  const toggleArchive = () => {
    toggleArchivedConversation(conversation.id);
    setArchived(!archived);
  };
  const handleArchiveToggle = (e) => {
    e.stopPropagation();
    toggleArchive();
  };
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartOffset.current = swipeOffset;
    setIsSwiping(true);
  };
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - swipeStartX.current;
    setSwipeOffset(Math.max(-80, Math.min(80, swipeStartOffset.current + diff)));
  };
  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset < -40) {
      if (!pinned) togglePin();
      setSwipeOffset(0);
    } else if (swipeOffset > 40) {
      if (!archived) toggleArchive();
      setSwipeOffset(0);
    } else {
      setSwipeOffset(0);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden", children: [
    swipeOffset !== 0 && /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-y-0 flex items-center px-4 text-xs font-medium text-white",
        style: {
          left: swipeOffset > 0 ? "0" : "auto",
          right: swipeOffset < 0 ? "0" : "auto",
          background: swipeOffset < 0 ? "linear-gradient(to left, #d97706, #f59e0b)" : "linear-gradient(to right, #2563eb, #3b82f6)"
        },
        children: swipeOffset < 0 ? "Archive" : "Pin"
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: { transform: `translateX(${swipeOffset}px)` },
        children: /* @__PURE__ */ jsxs(
          "button",
          {
            role: "listitem",
            onClick: () => {
              onSelect(conversation.id);
              setSwipeOffset(0);
            },
            className: `group flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#2a2a2a] ${isActive ? "bg-brand-50 dark:bg-[#2a2a2a]" : ""}`,
            children: [
              /* @__PURE__ */ jsx(
                Avatar,
                {
                  name: displayName,
                  size: "md",
                  src: conversation.other_user?.avatar_url
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 truncate text-sm font-medium text-gray-900 dark:text-[#ececec]", children: [
                    pinned && /* @__PURE__ */ jsx(Pin, { className: "h-3 w-3 shrink-0 text-gray-400" }),
                    displayName
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
                    lastMsg && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 dark:text-[#888]", children: formatDistanceToNow(lastMsg.created_at) }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: handleArchiveToggle,
                        className: `rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${archived ? "text-amber-500 opacity-100" : "text-gray-400 hover:text-amber-500"}`,
                        title: archived ? "Unarchive conversation" : "Archive conversation",
                        "aria-label": archived ? "Unarchive conversation" : "Archive conversation",
                        children: /* @__PURE__ */ jsx(Archive, { className: "h-3 w-3" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: handlePinToggle,
                        className: `rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${pinned ? "text-brand-500 opacity-100" : "text-gray-400 hover:text-brand-500"}`,
                        title: pinned ? "Unpin conversation" : "Pin conversation",
                        "aria-label": pinned ? "Unpin conversation" : "Pin conversation",
                        children: /* @__PURE__ */ jsx(Pin, { className: "h-3 w-3" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("p", { className: "truncate text-xs text-gray-500 dark:text-[#999]", children: [
                    isOwnLastMsg && /* @__PURE__ */ jsx("span", { className: "inline-flex mr-0.5 align-text-bottom", children: lastMsg?.status === "sending" ? /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-[10px]", children: "⏳" }) : lastMsg?.status === "failed" ? /* @__PURE__ */ jsx("span", { className: "text-red-400 text-[10px]", children: "⚠" }) : /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-gray-400 dark:text-[#888]" }) }),
                    previewText
                  ] }),
                  /* @__PURE__ */ jsx(Badge, { count: conversation.unread_count ?? 0 })
                ] })
              ] })
            ]
          }
        )
      }
    )
  ] });
}

function Skeleton({ className = "" }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative overflow-hidden rounded-ios-sm bg-ios-fill-light dark:bg-ios-fill-dark ${className}`,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 -translate-x-full",
            style: {
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              animation: "skeleton-shimmer 1.4s infinite"
            }
          }
        ),
        /* @__PURE__ */ jsx("style", { children: `@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }` })
      ]
    }
  );
}
function MessageSkeleton() {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 px-4 py-6", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsx("div", { className: `flex items-end gap-2 ${i % 2 === 0 ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs("div", { className: `flex flex-col gap-1.5 ${i % 2 === 0 ? "items-end" : "items-start"}`, children: [
    i === 1 && /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-16" }),
    /* @__PURE__ */ jsx(
      Skeleton,
      {
        className: `h-9 ${i % 2 === 0 ? "w-56" : "w-40"} rounded-[20px]`
      }
    ),
    i === 3 && /* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-32 rounded-[20px]" })
  ] }) }, i)) });
}
function ConversationSkeleton() {
  return /* @__PURE__ */ jsx("div", { className: "px-3 py-2", children: [1, 2, 3, 4, 5, 6].map((i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-2 py-3", children: [
    /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-12 rounded-[12px]" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-32" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-44" })
    ] })
  ] }, i)) });
}

function ConversationList({
  conversations,
  loading,
  userId,
  searchQuery,
  showArchived = false,
  activeConversationId,
  onSelect,
  onRefresh
}) {
  const containerRef = useRef(null);
  const [pulling, setPulling] = useState(false);
  const pullStartY = useRef(0);
  const pullOffset = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
      pullOffset.current = 0;
    }
  }, []);
  const handleTouchMove = useCallback((e) => {
    if (pullStartY.current === 0) return;
    const dist = Math.max(0, (e.touches[0].clientY - pullStartY.current) * 0.5);
    pullOffset.current = dist;
    setPullDistance(dist);
    if (dist > 60) setPulling(true);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (pullOffset.current > 60) {
      setPulling(true);
      Promise.resolve(onRefresh()).finally(() => {
        setPulling(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    pullStartY.current = 0;
    pullOffset.current = 0;
  }, [onRefresh]);
  const filtered = conversations.filter((c) => showArchived ? isArchived(c.id) : !isArchived(c.id)).filter((c) => {
    if (!searchQuery) return true;
    const name = c.type === "direct" ? c.other_user?.full_name?.toLowerCase() ?? "" : c.name?.toLowerCase() ?? "";
    return name.includes(searchQuery.toLowerCase());
  });
  if (loading) return /* @__PURE__ */ jsx(ConversationSkeleton, {});
  if (filtered.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center px-6 py-20 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ios-fill-light dark:bg-ios-fill-dark", children: showArchived ? /* @__PURE__ */ jsx(Archive, { className: "h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark", strokeWidth: 1.8 }) : /* @__PURE__ */ jsx(MessageSquare, { className: "h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark", strokeWidth: 1.8 }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: showArchived ? "No Archived Chats" : searchQuery ? "No Results" : "No Messages" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: showArchived ? "Archived conversations will appear here." : searchQuery ? "No conversations match your search." : "Start a new conversation to see it here." })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      className: "scrollbar-thin flex-1 overflow-y-auto",
      role: "list",
      children: [
        pullDistance > 0 && /* @__PURE__ */ jsx(
          "div",
          {
            className: "flex items-center justify-center",
            style: { height: Math.min(pullDistance, 60) },
            children: pulling ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin text-ios-blue-light dark:text-ios-blue-dark" }) : /* @__PURE__ */ jsx("span", { className: "text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Pull to refresh" })
          }
        ),
        filtered.map((conv) => /* @__PURE__ */ jsx(
          ConversationItem,
          {
            conversation: conv,
            isActive: conv.id === activeConversationId,
            onSelect,
            currentUserId: userId
          },
          conv.id
        )),
        /* @__PURE__ */ jsx("div", { className: "h-4" })
      ]
    }
  );
}

const PAGE_SIZE = 50;
async function searchMessages(userId, query) {
  if (!query.trim()) return [];
  const { data: convIds } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
  if (!convIds?.length) return [];
  const ids = convIds.map((c) => c.conversation_id);
  const { data } = await supabase.from("messages").select("conversation_id, content, created_at, sender_id").in("conversation_id", ids).is("deleted_at", null).ilike("content", `%${query}%`).order("created_at", { ascending: false }).limit(20);
  return data ?? [];
}
async function getMessages(conversationId, cursor, limit = PAGE_SIZE) {
  let query = supabase.from("messages").select("*, sender:profiles!sender_id(id, full_name, avatar_url), reply_to:messages!reply_to_id(id, content, sender_id, deleted_at), forwarded_from:messages!forwarded_from_id(id, content, sender_id, deleted_at, sender:profiles!sender_id(id, full_name)), reactions:reactions(*), read_receipts:read_receipts(*, profile:profiles(id, full_name))").eq("conversation_id", conversationId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }
  const { data } = await query;
  const hasMore = (data?.length ?? 0) > limit;
  const messages = data?.slice(0, limit).reverse() ?? [];
  return { messages, hasMore };
}
async function sendMessage(conversationId, senderId, content, replyToId, forwardedFromId) {
  const { data, error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    reply_to_id: replyToId ?? null,
    forwarded_from_id: forwardedFromId ?? null
  }).select("*, sender:profiles!sender_id(id, full_name, avatar_url)").single();
  if (error) throw error;
  return data;
}
async function editMessage(messageId, content) {
  const { error } = await supabase.from("messages").update({ content, is_edited: true, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", messageId);
  if (error) throw error;
}
async function deleteMessage(messageId) {
  const { error } = await supabase.from("messages").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", messageId);
  if (error) throw error;
}
async function markAsRead(conversationId, userId) {
  const { data: lastMessage } = await supabase.from("messages").select("id").eq("conversation_id", conversationId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1);
  if (!lastMessage?.length) return;
  const readAt = (/* @__PURE__ */ new Date()).toISOString();
  const { error } = await supabase.from("message_reads").upsert(
    { message_id: lastMessage[0].id, user_id: userId, read_at: readAt },
    { onConflict: "message_id,user_id" }
  );
  if (error) throw error;
  const { error: receiptError } = await supabase.from("read_receipts").upsert(
    { message_id: lastMessage[0].id, user_id: userId, read_at: readAt },
    { onConflict: "message_id,user_id" }
  );
  if (receiptError) console.error("Failed to write read receipt:", receiptError);
}
async function toggleReaction(messageId, userId, emoji) {
  const { data: existing } = await supabase.from("reactions").select("id").eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji).maybeSingle();
  if (existing) {
    const { error: error2 } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error2) throw error2;
    return false;
  }
  const { error } = await supabase.from("reactions").insert({ message_id: messageId, user_id: userId, emoji });
  if (error) throw error;
  return true;
}
async function getPinnedMessages(conversationId) {
  const { data } = await supabase.from("pinned_messages").select("*, message:messages!message_id(id, content, sender_id, created_at, sender:profiles!sender_id(id, full_name)), pinner:profiles!pinned_by(id, full_name)").eq("conversation_id", conversationId).order("created_at", { ascending: false });
  return data ?? [];
}
async function pinMessage(conversationId, messageId, userId) {
  const { error } = await supabase.from("pinned_messages").insert({ conversation_id: conversationId, message_id: messageId, pinned_by: userId });
  if (error) throw error;
}
async function unpinMessage(pinId) {
  const { error } = await supabase.from("pinned_messages").delete().eq("id", pinId);
  if (error) throw error;
}

const DEBOUNCE_MS = 300;
function useSearch(userId, query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const performSearch = async () => {
      if (!userId || !query.trim()) {
        if (!cancelled) setResults([]);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await searchMessages(userId, query);
          if (!cancelled) setResults(data);
        } catch (e) {
          console.error("Failed to search messages:", e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }, DEBOUNCE_MS);
    };
    performSearch();
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userId, query]);
  return { results, loading };
}

function SearchBar({ userId, value, onChange, onSelectResult }) {
  const [focused, setFocused] = useState(false);
  const { results, loading } = useSearch(userId, value);
  const ref = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref, className: "px-3 pt-2 pb-2", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
      /* @__PURE__ */ jsx(
        Search,
        {
          className: "pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          value,
          onChange: (e) => onChange(e.target.value),
          onFocus: () => setFocused(true),
          placeholder: "Search",
          "aria-label": "Search messages",
          className: "h-9 w-full rounded-[10px] bg-ios-fill-light pl-9 pr-9 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-fill-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
        }
      ),
      loading && /* @__PURE__ */ jsx(Loader2, { className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ios-secondary_label-light dark:text-ios-secondary_label-dark" }),
      !loading && value.trim() && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            onChange("");
            inputRef.current?.focus();
          },
          className: "absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-ios-secondary_label-light text-white active:opacity-70 dark:bg-ios-secondary_label-dark",
          "aria-label": "Clear search",
          children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3", strokeWidth: 3 })
        }
      )
    ] }) }),
    focused && value.trim() && /* @__PURE__ */ jsx("div", { className: "mt-2 overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios dark:bg-ios-secondary-dark", children: results.length === 0 && !loading ? /* @__PURE__ */ jsx("p", { className: "px-4 py-6 text-center text-[15px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "No messages found" }) : /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto", children: results.map((r, i) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          onSelectResult?.(r.conversation_id);
          setFocused(false);
          onChange("");
        },
        className: "flex w-full items-start gap-3 px-4 py-3 text-left active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ios-blue-light/15 dark:bg-ios-blue-dark/25", children: /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 text-ios-blue-light dark:text-ios-blue-dark", strokeWidth: 2.5 }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-[15px] text-ios-label-light dark:text-ios-label-dark", children: r.content }),
            /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: formatDistanceToNow(r.created_at) })
          ] })
        ]
      },
      `${r.conversation_id}-${i}`
    )) }) })
  ] });
}

function UserFooter({ user, onAdminPanel, onEnableNotifications }) {
  const [profile, setProfile] = useState(null);
  const [notifPermission, setNotifPermission] = useState(typeof window !== "undefined" ? getNotificationPermission() : "unsupported");
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getProfile(user.id).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  const handleEnableNotifications = async () => {
    const granted = await onEnableNotifications();
    setNotifPermission(granted ? "granted" : getNotificationPermission());
  };
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const isAdmin = profile?.role === "admin";
  return /* @__PURE__ */ jsx("div", { className: "border-t border-ios-separator-light bg-ios-bg-light/60 px-3 py-2 backdrop-blur-md dark:border-ios-separator-dark dark:bg-ios-grouped-dark/60", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-ios-lg bg-ios-fill-light/60 p-2 dark:bg-ios-secondary-dark", children: [
    /* @__PURE__ */ jsx(Avatar, { name: displayName, size: "md", src: profile?.avatar_url }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("p", { className: "truncate text-[15px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: displayName }),
      /* @__PURE__ */ jsx("p", { className: "truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: user?.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-0.5", children: [
      notifPermission === "default" && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleEnableNotifications,
          className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-secondary_label-light hover:bg-ios-fill-light active:bg-ios-fill-light/70 dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark",
          title: "Enable notifications",
          "aria-label": "Enable notifications",
          children: /* @__PURE__ */ jsx(Bell, { className: "h-[18px] w-[18px]", strokeWidth: 2 })
        }
      ),
      notifPermission === "denied" && /* @__PURE__ */ jsx(
        "span",
        {
          className: "flex h-9 w-9 items-center justify-center text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark",
          title: "Notifications blocked in browser settings",
          "aria-label": "Notifications blocked",
          children: /* @__PURE__ */ jsx(BellOff, { className: "h-[18px] w-[18px]", strokeWidth: 2 })
        }
      ),
      isAdmin && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onAdminPanel,
          className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-secondary_label-light hover:bg-ios-fill-light active:bg-ios-fill-light/70 dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark",
          title: "Admin Panel",
          "aria-label": "Admin panel",
          children: /* @__PURE__ */ jsx(Settings, { className: "h-[18px] w-[18px]", strokeWidth: 2 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: async () => {
            await signOut();
          },
          className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-red-light hover:bg-ios-red-light/12 active:bg-ios-red-light/20 dark:text-ios-red-dark",
          title: "Sign out",
          "aria-label": "Sign out",
          children: /* @__PURE__ */ jsx(LogOut, { className: "h-[18px] w-[18px]", strokeWidth: 2 })
        }
      )
    ] })
  ] }) });
}

function useProfiles(excludeUserId) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getAllActiveProfiles().then((data) => {
      if (cancelled) return;
      setProfiles(data);
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      console.error("Failed to load profiles:", e);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const search = useCallback(
    async (query) => {
      try {
        if (!query.trim()) {
          const data2 = await getAllActiveProfiles();
          setProfiles(data2);
          return;
        }
        const data = await searchProfiles(query, excludeUserId);
        setProfiles(data);
      } catch (e) {
        console.error("Failed to search profiles:", e);
      }
    },
    [excludeUserId]
  );
  return { profiles, loading, search };
}

let modalCounter = 0;
function Modal({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  hideClose
}) {
  const closeRef = useRef(null);
  const sheetRef = useRef(null);
  const [titleId] = useState(() => `modal-title-${modalCounter++}`);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      const root = e.currentTarget;
      const focusable = root.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  };
  if (!open) return null;
  const isCentered = variant === "centered";
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade md:items-center",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": title ? titleId : void 0,
      onKeyDown: handleKeyDown,
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: sheetRef,
          className: `relative w-full overflow-hidden bg-ios-bg-light shadow-ios-lg dark:bg-ios-grouped-dark md:bg-ios-bg-light md:dark:bg-ios-grouped-dark ${isCentered ? "mx-4 max-w-lg rounded-ios-xl animate-ios-pop" : "max-h-[90dvh] rounded-t-ios-xl animate-ios-slide-up md:max-h-[80vh] md:max-w-lg md:rounded-ios-xl"}`,
          role: "document",
          children: [
            !isCentered && /* @__PURE__ */ jsx("div", { className: "ios-sheet-grabber", "aria-hidden": true }),
            title && /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center border-b border-ios-separator-light px-4 py-3 dark:border-ios-separator-dark md:px-6", children: [
              /* @__PURE__ */ jsx(
                "h2",
                {
                  id: titleId,
                  className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark",
                  children: title
                }
              ),
              !hideClose && /* @__PURE__ */ jsx(
                "button",
                {
                  ref: closeRef,
                  onClick: onClose,
                  "aria-label": "Close",
                  className: "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ios-fill-light text-ios-secondary_label-light active:bg-ios-fill-light/70 dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark md:right-4 md:top-4",
                  children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4", strokeWidth: 2.5 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-y-auto", children })
          ]
        }
      )
    }
  );
}

function NewChatModal({ open, onClose, userId, onConversationCreated }) {
  const [mode, setMode] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { profiles, search: searchProfiles } = useProfiles(userId);
  const handleSearch = (val) => {
    setSearch(val);
    searchProfiles(val);
  };
  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      if (mode === "direct" && selectedIds.length === 1) {
        const convId = await findOrCreateDirectConversation(userId, selectedIds[0]);
        onConversationCreated(convId);
      } else if (mode === "group" && groupName.trim() && selectedIds.length > 0) {
        const convId = await createGroupConversation(groupName.trim(), userId, selectedIds);
        onConversationCreated(convId);
      }
      onClose();
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreating(false);
    }
  };
  const reset = () => {
    setMode(null);
    setGroupName("");
    setSelectedIds([]);
    setSearch("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  if (!mode) {
    return /* @__PURE__ */ jsxs(Modal, { open, onClose: handleClose, title: "New Chat", hideClose: true, children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setMode("direct"),
            className: "ios-press flex w-full items-center gap-3 rounded-ios-lg bg-ios-fill-light p-3 active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:active:bg-ios-secondary-dark/70",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-[10px] bg-ios-blue-light text-white dark:bg-ios-blue-dark", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5", strokeWidth: 2.2 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark", children: "New Message" }),
                /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Chat with a single person" })
              ] }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark", strokeWidth: 2.5 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setMode("group"),
            className: "ios-press flex w-full items-center gap-3 rounded-ios-lg bg-ios-fill-light p-3 active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:active:bg-ios-secondary-dark/70",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-[10px] bg-ios-green-light text-white dark:bg-ios-green-dark", children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5", strokeWidth: 2.2 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark", children: "New Group" }),
                /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Start a team conversation" })
              ] }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-ios-tertiary_label-light dark:text-ios-tertiary_label-dark", strokeWidth: 2.5 })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })
    ] });
  }
  return /* @__PURE__ */ jsxs(
    Modal,
    {
      open,
      onClose: handleClose,
      title: mode === "group" ? "New Group" : "New Message",
      hideClose: true,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          mode === "group" && /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Group name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: groupName,
                onChange: (e) => setGroupName(e.target.value),
                placeholder: "e.g. Marketing Team",
                className: "h-10 w-full rounded-[10px] bg-ios-fill-light px-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: mode === "group" ? "To:" : "Send to" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              Search,
              {
                className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
                strokeWidth: 2.5
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: search,
                onChange: (e) => handleSearch(e.target.value),
                placeholder: "Search people",
                "aria-label": "Search employees",
                className: "h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
              }
            )
          ] }),
          selectedIds.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: selectedIds.map((id) => {
            const p = profiles.find((x) => x.id === id);
            return /* @__PURE__ */ jsxs(
              "span",
              {
                className: "ios-press flex items-center gap-1.5 rounded-full bg-ios-blue-light py-0.5 pl-0.5 pr-2 text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
                children: [
                  /* @__PURE__ */ jsx(Avatar, { name: p?.full_name ?? "?", size: "xs", src: p?.avatar_url }),
                  /* @__PURE__ */ jsx("span", { className: "text-[12px] font-medium", children: p?.full_name ?? "User" })
                ]
              },
              id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto px-2 pb-2", children: profiles.filter((p) => p.id !== userId).map((p) => {
          const selected = selectedIds.includes(p.id);
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => toggleSelect(p.id),
              className: "ios-press flex w-full items-center gap-3 rounded-[10px] px-2 py-2 active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
              children: [
                /* @__PURE__ */ jsx(Avatar, { name: p.full_name, size: "md", src: p.avatar_url }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-left", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark", children: p.full_name }),
                  /* @__PURE__ */ jsx("p", { className: "truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: p.email ?? p.role })
                ] }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `flex h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? "border-ios-blue-light bg-ios-blue-light dark:border-ios-blue-dark dark:bg-ios-blue-dark" : "border-ios-tertiary_label-light dark:border-ios-tertiary_label-dark"}`,
                    children: selected && /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5 text-white", strokeWidth: 3 })
                  }
                )
              ]
            },
            p.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-ios-separator-light p-4 dark:border-ios-separator-dark", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setMode(null),
              className: "ios-press flex-1 rounded-[10px] bg-ios-fill-light py-2.5 text-[15px] font-medium text-ios-label-light active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:text-ios-label-dark",
              children: "Back"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleCreate,
              disabled: creating || mode === "direct" && selectedIds.length !== 1 || mode === "group" && (!groupName.trim() || selectedIds.length === 0),
              className: "ios-press flex flex-1 items-center justify-center rounded-[10px] bg-ios-blue-light py-2.5 text-[15px] font-semibold text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark",
              children: creating ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : mode === "group" ? "Create" : "Send"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })
      ]
    }
  );
}

function Sidebar({
  user,
  activeConversationId,
  onSelectConversation,
  onAdminPanel,
  onEnableNotifications
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { theme, toggle } = useTheme();
  const { conversations, loading, refresh } = useConversations(user?.id);
  const handleConversationCreated = useCallback(
    (id) => {
      onSelectConversation(id);
      refresh();
    },
    [onSelectConversation, refresh]
  );
  return /* @__PURE__ */ jsxs("aside", { className: "flex h-full w-full flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-2 px-4 pb-2 pt-3", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-[34px] font-bold leading-[40px] tracking-tight text-ios-label-light dark:text-ios-label-dark", children: showArchived ? "Archive" : "Messages" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(ThemeToggle, { theme, onToggle: toggle }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowArchived((v) => !v),
            className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light hover:bg-ios-blue-light/10 active:bg-ios-blue-light/20 dark:text-ios-blue-dark dark:hover:bg-ios-blue-dark/20",
            title: showArchived ? "Show active chats" : "Show archived chats",
            "aria-label": showArchived ? "Show active chats" : "Show archived chats",
            children: showArchived ? /* @__PURE__ */ jsx(ArchiveRestore, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 }) : /* @__PURE__ */ jsx(Archive, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setNewChatOpen(true),
            className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light hover:bg-ios-blue-light/10 active:bg-ios-blue-light/20 dark:text-ios-blue-dark dark:hover:bg-ios-blue-dark/20",
            title: "New Chat",
            "aria-label": "New chat",
            children: /* @__PURE__ */ jsx(Edit, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      SearchBar,
      {
        userId: user?.id,
        value: searchQuery,
        onChange: setSearchQuery,
        onSelectResult: onSelectConversation
      }
    ),
    /* @__PURE__ */ jsx(
      ConversationList,
      {
        conversations,
        loading,
        userId: user?.id,
        searchQuery,
        showArchived,
        activeConversationId,
        onSelect: onSelectConversation,
        onRefresh: refresh
      }
    ),
    /* @__PURE__ */ jsx(UserFooter, { user, onAdminPanel, onEnableNotifications }),
    user && /* @__PURE__ */ jsx(
      NewChatModal,
      {
        open: newChatOpen,
        onClose: () => setNewChatOpen(false),
        userId: user.id,
        onConversationCreated: handleConversationCreated
      }
    )
  ] });
}

const STORAGE_KEY = "apex-chat-disappearing";
function getConversationTimer(convId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "off";
    const timers = JSON.parse(raw);
    return timers[convId] || "off";
  } catch {
    return "off";
  }
}
function setConversationTimer(convId, timer) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const timers = raw ? JSON.parse(raw) : {};
    timers[convId] = timer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch {
  }
}
function getExpiresAt(timer) {
  if (timer === "off") return null;
  const now = Date.now();
  const ms = timer === "1h" ? 36e5 : timer === "24h" ? 864e5 : 6048e5;
  return new Date(now + ms).toISOString();
}
function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function useMessageList(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const messagesRef = useRef([]);
  const cancelledRef = useRef(false);
  const loadGenRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      setMessages((prev) => prev.filter((m) => !isExpired(m.expires_at)));
    }, 1e4);
    return () => clearInterval(t);
  }, []);
  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    cancelledRef.current = false;
    setLoading(true);
    try {
      const { messages: msgs, hasMore: more } = await getMessages(conversationId);
      if (cancelledRef.current) return;
      setMessages(msgs);
      setHasMore(more);
    } catch (err) {
      if (!cancelledRef.current) console.error("Failed to load messages:", err);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [conversationId]);
  const loadMore = useCallback(async () => {
    const msgs = messagesRef.current;
    if (!conversationId || !msgs.length || !hasMore) return;
    cancelledRef.current = false;
    const oldest = msgs[0];
    const gen = ++loadGenRef.current;
    try {
      const { messages: older, hasMore: more } = await getMessages(conversationId, {
        created_at: oldest.created_at,
        id: oldest.id
      });
      if (cancelledRef.current || gen !== loadGenRef.current) return;
      setMessages((prev) => [...older, ...prev]);
      setHasMore(more);
    } catch (err) {
      if (!cancelledRef.current) console.error("Failed to load older messages:", err);
    }
  }, [conversationId, hasMore]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMessages([]);
      setHasMore(true);
      cancelledRef.current = true;
      try {
        if (conversationId) {
          await loadInitial();
        }
      } finally {
        cancelledRef.current = cancelled;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, loadInitial]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  return { messages, setMessages, loading, hasMore, loadMore };
}
function useMessageChannel(conversationId, currentUserId, onInsert, onUpdate, onReadReceipt) {
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`conversation:${conversationId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const msg = payload.new;
        if (msg.sender_id === currentUserId) return;
        onInsert(msg);
      }
    ).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onUpdate(payload.new);
      }
    ).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "read_receipts" },
      (payload) => {
        const r = payload.new;
        if (r.user_id === currentUserId) return;
        onReadReceipt(r);
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, onInsert, onUpdate, onReadReceipt]);
}
function useMessages(conversationId, currentUserId) {
  const { messages, setMessages, loading, hasMore, loadMore } = useMessageList(conversationId);
  const [sending, setSending] = useState(false);
  const lastSendRef = useRef(0);
  const buildOptimistic = useCallback(
    (content, replyToId, forwardedFromId) => {
      const timer = conversationId ? getConversationTimer(conversationId) : "off";
      return {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content || null,
        reply_to_id: replyToId,
        forwarded_from_id: forwardedFromId,
        is_edited: false,
        deleted_at: null,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: getExpiresAt(timer),
        status: "sending"
      };
    },
    [conversationId, currentUserId]
  );
  const sendMessage$1 = useCallback(
    async (content, replyToId = null, forwardedFromId = null) => {
      if (!conversationId || !currentUserId || !content.trim()) return;
      const now = Date.now();
      if (now - lastSendRef.current < 200) return;
      lastSendRef.current = now;
      const optimistic = buildOptimistic(content, replyToId, forwardedFromId);
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      try {
        const saved = await sendMessage(
          conversationId,
          currentUserId,
          content,
          replyToId,
          forwardedFromId
        );
        setMessages(
          (prev) => prev.map((m) => m.id === optimistic.id ? { ...saved, status: "sent" } : m)
        );
      } catch (e) {
        console.error("Failed to send message:", e);
        setMessages(
          (prev) => prev.map((m) => m.id === optimistic.id ? { ...m, status: "failed" } : m)
        );
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId, buildOptimistic, setMessages]
  );
  const sendWithAttachments = useCallback(
    async (content, attachments, replyToId = null, forwardedFromId = null) => {
      if (!conversationId || !currentUserId) return;
      const now = Date.now();
      if (now - lastSendRef.current < 200) return;
      lastSendRef.current = now;
      const optimistic = buildOptimistic(content, replyToId, forwardedFromId);
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      try {
        const msgContent = content || null;
        const { data: message, error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: msgContent,
          reply_to_id: replyToId,
          forwarded_from_id: forwardedFromId
        }).select("*, sender:profiles!sender_id(id, full_name, avatar_url)").single();
        if (error) throw error;
        if (attachments.length > 0) {
          await supabase.from("attachments").insert(
            attachments.map((att) => ({
              ...att,
              message_id: message.id,
              conversation_id: conversationId,
              sender_id: currentUserId
            }))
          );
        }
        setMessages(
          (prev) => prev.map(
            (m) => m.id === optimistic.id ? { ...message, status: "sent" } : m
          )
        );
      } catch (e) {
        console.error("Failed to send message with attachments:", e);
        setMessages(
          (prev) => prev.map((m) => m.id === optimistic.id ? { ...m, status: "failed" } : m)
        );
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId, buildOptimistic, setMessages]
  );
  const forwardMessage = useCallback(
    async (targetConversationId, content, forwardedFromId) => {
      if (!currentUserId) return;
      await sendMessage(targetConversationId, currentUserId, content, null, forwardedFromId);
    },
    [currentUserId]
  );
  const handleInsert = useCallback(
    (msg) => {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    },
    [setMessages]
  );
  const handleUpdate = useCallback(
    (updated) => {
      setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
    },
    [setMessages]
  );
  const handleReadReceipt = useCallback(
    async (r) => {
      const { data: profile } = await supabase.from("profiles").select("id, full_name, email, avatar_url, role, is_active, created_at").eq("id", r.user_id).single();
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === r.message_id);
        if (!msg || msg.conversation_id !== conversationId) return prev;
        const readReceipt = {
          id: crypto.randomUUID(),
          message_id: r.message_id,
          user_id: r.user_id,
          read_at: (/* @__PURE__ */ new Date()).toISOString(),
          profile: profile ?? void 0
        };
        return prev.map(
          (m) => m.id === r.message_id ? { ...m, read_receipts: [...m.read_receipts ?? [], readReceipt] } : m
        );
      });
    },
    [conversationId, setMessages]
  );
  useMessageChannel(conversationId, currentUserId, handleInsert, handleUpdate, handleReadReceipt);
  return {
    messages,
    loading,
    hasMore,
    sending,
    loadMore,
    sendMessage: sendMessage$1,
    sendWithAttachments,
    forwardMessage
  };
}

const TYPING_AUTO_STOP_MS = 3e3;
function useTypingIndicator(conversationId, currentUserId) {
  const [typingUserIds, setTypingUserIds] = useState([]);
  const [ready, setReady] = useState(false);
  const timeoutRef = useRef(null);
  const channelRef = useRef(null);
  const userIdRef = useRef(currentUserId);
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`typing:${conversationId}`);
    channel.on("broadcast", { event: "typing" }, (payload) => {
      const { user_id, is_typing } = payload.payload;
      if (user_id === userIdRef.current) return;
      setTypingUserIds((prev) => {
        if (is_typing) return prev.includes(user_id) ? prev : [...prev, user_id];
        return prev.filter((id) => id !== user_id);
      });
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setReady(true);
      }
    });
    channelRef.current = channel;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setTypingUserIds([]);
      setReady(false);
    };
  }, [conversationId]);
  const setTyping = useCallback(
    (isTyping) => {
      const uid = userIdRef.current;
      if (!channelRef.current || !uid || !ready) return;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: uid, is_typing: isTyping }
      });
      if (isTyping) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { user_id: uid, is_typing: false }
          });
        }, TYPING_AUTO_STOP_MS);
      }
    },
    [ready]
  );
  return { typingUserIds, setTyping };
}

function usePresence(conversationId, currentUserId) {
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: currentUserId } }
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const userIds = Object.values(state).flat().map((p) => p.user_id).filter((id) => id !== currentUserId);
      setOnlineUserIds(userIds);
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: currentUserId,
          online_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        channel.track({
          user_id: currentUserId,
          online_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
      setOnlineUserIds([]);
    };
  }, [conversationId, currentUserId]);
  return { onlineUserIds };
}

const ChatHeader = memo(function ChatHeader2({
  conversationId,
  currentUserId,
  onlineUserIds,
  isAdmin,
  onGroupSettings,
  onBack,
  typingNames
}) {
  const [conv, setConv] = useState(null);
  const [members, setMembers] = useState([]);
  const [timerOpen, setTimerOpen] = useState(false);
  const timerValue = conversationId ? getConversationTimer(conversationId) : "off";
  useEffect(() => {
    if (!conversationId) {
      setConv(null);
      setMembers([]);
      return;
    }
    let cancelled = false;
    supabase.from("conversations").select("*").eq("id", conversationId).single().then(({ data }) => {
      if (!cancelled) setConv(data ?? null);
    });
    supabase.from("conversation_members").select("user_id").eq("conversation_id", conversationId).then(async ({ data: memberRows }) => {
      if (!memberRows?.length || cancelled) return;
      const ids = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, last_seen_at").in("id", ids);
      if (profiles && !cancelled) {
        setMembers(profiles);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);
  useEffect(() => {
    if (!timerOpen) return;
    const handler = (e) => {
      const target = e.target;
      if (!target.closest("[data-timer-menu]")) setTimerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [timerOpen]);
  if (!conv) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "ios-blur flex h-[52px] items-center gap-3 border-b border-ios-separator-light bg-ios-bg-light/80 px-3 dark:border-ios-separator-dark dark:bg-ios-grouped-dark/80",
        "aria-label": "Loading conversation",
        children: [
          /* @__PURE__ */ jsx("div", { className: "h-9 w-9 shrink-0 animate-pulse rounded-[10px] bg-ios-fill-light dark:bg-ios-fill-dark" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-40 animate-pulse rounded bg-ios-fill-light dark:bg-ios-fill-dark" })
        ]
      }
    );
  }
  const otherMember = members.find((m) => m.id !== currentUserId);
  const displayName = conv.type === "direct" ? otherMember?.full_name || members.map((m) => m.full_name).join(", ") || "User" : conv.name ?? "Unnamed Group";
  const otherId = otherMember?.id;
  const otherOnline = otherId ? onlineUserIds?.includes(otherId) ?? false : false;
  const groupOnline = (onlineUserIds?.length ?? 0) - (currentUserId && onlineUserIds?.includes(currentUserId) ? 1 : 0);
  const lastSeenAt = otherMember?.last_seen_at;
  return /* @__PURE__ */ jsxs("div", { className: "ios-blur relative flex h-[52px] items-center gap-1 border-b border-ios-separator-light bg-ios-bg-light/75 px-2 dark:border-ios-separator-dark dark:bg-ios-grouped-dark/75", children: [
    onBack && /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onBack,
        "aria-label": "Back to conversations",
        className: "ios-press -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark md:hidden",
        children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-6 w-6", strokeWidth: 2.5 })
      }
    ),
    /* @__PURE__ */ jsx("button", { className: "ios-press flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark md:hidden", children: /* @__PURE__ */ jsx(Avatar, { name: displayName, size: "sm", src: otherMember?.avatar_url }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col items-center justify-center px-2", children: [
      /* @__PURE__ */ jsx("p", { className: "truncate text-[15px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: displayName }),
      /* @__PURE__ */ jsx("p", { className: "truncate text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: typingNames && typingNames.length > 0 ? /* @__PURE__ */ jsx("span", { className: "text-ios-blue-light dark:text-ios-blue-dark", children: typingNames.length === 1 ? `${typingNames[0]} is typing…` : typingNames.length === 2 ? `${typingNames.join(" and ")} are typing…` : `${typingNames[0]} and ${typingNames.length - 1} others are typing…` }) : conv.type === "group" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        members.length,
        " members",
        groupOnline > 0 ? ` · ${groupOnline} online` : ""
      ] }) : otherOnline ? /* @__PURE__ */ jsx("span", { className: "text-ios-label-light dark:text-ios-label-dark", children: "Online" }) : lastSeenAt ? /* @__PURE__ */ jsxs(Fragment, { children: [
        "Last seen ",
        formatLastSeen(lastSeenAt)
      ] }) : "Offline" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center", children: [
      conv.type === "group" && isAdmin && /* @__PURE__ */ jsxs("div", { className: "relative", "data-timer-menu": true, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setTimerOpen((v) => !v),
            className: `ios-press flex h-9 w-9 items-center justify-center rounded-full active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${timerValue !== "off" ? "text-ios-blue-light dark:text-ios-blue-dark" : "text-ios-blue-light dark:text-ios-blue-dark"}`,
            title: "Disappearing messages",
            "aria-label": "Disappearing messages",
            children: /* @__PURE__ */ jsx(Timer, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
          }
        ),
        timerOpen && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios-lg dark:bg-ios-secondary-dark animate-ios-pop",
            role: "menu",
            children: ["off", "1h", "24h", "7d"].map((val) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  if (conversationId) setConversationTimer(conversationId, val);
                  setTimerOpen(false);
                },
                className: `flex w-full items-center px-4 py-2.5 text-[15px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${timerValue === val ? "text-ios-blue-light dark:text-ios-blue-dark font-medium" : "text-ios-label-light dark:text-ios-label-dark"}`,
                role: "menuitem",
                children: val === "off" ? "Off" : val === "1h" ? "1 hour" : val === "24h" ? "24 hours" : "7 days"
              },
              val
            ))
          }
        )
      ] }),
      conv.type === "group" && isAdmin && onGroupSettings && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onGroupSettings,
          className: "ios-press -mr-1 flex h-9 w-9 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/10 dark:text-ios-blue-dark",
          title: "Group Info",
          "aria-label": "Group info",
          children: /* @__PURE__ */ jsx(Info, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
        }
      )
    ] })
  ] });
});

const ALLOWED_EXTENSIONS = [
  "pdf",
  "xls",
  "xlsx",
  "csv",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "zip",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp4",
  "mov",
  "webm",
  "mp3",
  "wav",
  "m4a",
  "dwg",
  "dxf",
  "dwf",
  "rvt",
  "rfa",
  "ifc",
  "nwd",
  "nwc",
  "skp"
];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"];
const MAX_FILE_SIZE = 100 * 1024 * 1024;
function isExtensionAllowed(ext) {
  return ALLOWED_EXTENSIONS.includes(ext.toLowerCase());
}
function getExtension(filename) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}
function isImage(ext) {
  return IMAGE_EXTENSIONS.includes(ext.toLowerCase());
}
function isVideo(ext) {
  return VIDEO_EXTENSIONS.includes(ext.toLowerCase());
}
function isAudio(ext) {
  return AUDIO_EXTENSIONS.includes(ext.toLowerCase());
}
function generateStoragePath(conversationId, filename) {
  const ext = getExtension(filename);
  const uuid = crypto.randomUUID();
  return `${conversationId}/${uuid}.${ext}`;
}

const ICON_MAP = {
  jpg: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  jpeg: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  png: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  webp: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  gif: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  svg: { Icon: Image, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  mp4: { Icon: Film, className: "text-ios-purple-light dark:text-ios-purple-dark" },
  mov: { Icon: Film, className: "text-ios-purple-light dark:text-ios-purple-dark" },
  webm: { Icon: Film, className: "text-ios-purple-light dark:text-ios-purple-dark" },
  mp3: { Icon: Music, className: "text-ios-pink-light dark:text-ios-pink-dark" },
  wav: { Icon: Music, className: "text-ios-pink-light dark:text-ios-pink-dark" },
  m4a: { Icon: Music, className: "text-ios-pink-light dark:text-ios-pink-dark" },
  pdf: { Icon: FileText, className: "text-ios-red-light dark:text-ios-red-dark" },
  xls: { Icon: FileSpreadsheet, className: "text-ios-green-light dark:text-ios-green-dark" },
  xlsx: { Icon: FileSpreadsheet, className: "text-ios-green-light dark:text-ios-green-dark" },
  csv: { Icon: FileSpreadsheet, className: "text-ios-green-light dark:text-ios-green-dark" },
  doc: { Icon: FileText, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  docx: { Icon: FileText, className: "text-ios-blue-light dark:text-ios-blue-dark" },
  ppt: { Icon: FileText, className: "text-ios-orange-light dark:text-ios-orange-dark" },
  pptx: { Icon: FileText, className: "text-ios-orange-light dark:text-ios-orange-dark" },
  txt: { Icon: FileText, className: "text-ios-secondary_label-light dark:text-ios-secondary_label-dark" },
  zip: { Icon: FileArchive, className: "text-ios-orange-light dark:text-ios-orange-dark" },
  rar: { Icon: FileArchive, className: "text-ios-orange-light dark:text-ios-orange-dark" },
  "7z": { Icon: FileArchive, className: "text-ios-orange-light dark:text-ios-orange-dark" },
  dwg: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  dxf: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  dwf: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  rvt: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  rfa: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  ifc: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" },
  skp: { Icon: FileCode, className: "text-ios-indigo-light dark:text-ios-indigo-dark" }
};
const EXT_COLORS = {
  pdf: "bg-ios-red-light/15 text-ios-red-light dark:bg-ios-red-dark/20 dark:text-ios-red-dark",
  doc: "bg-ios-blue-light/15 text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark",
  docx: "bg-ios-blue-light/15 text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark",
  xls: "bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark",
  xlsx: "bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark",
  csv: "bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark",
  zip: "bg-ios-orange-light/15 text-ios-orange-light dark:bg-ios-orange-dark/20 dark:text-ios-orange-dark",
  mp4: "bg-ios-purple-light/15 text-ios-purple-light dark:bg-ios-purple-dark/20 dark:text-ios-purple-dark"
};
function FileCard({ name, size, extension, url }) {
  const ext = extension.toLowerCase();
  const { Icon } = ICON_MAP[ext] ?? { Icon: File$1 };
  const colorClass = EXT_COLORS[ext] ?? "bg-ios-fill-light text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark";
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "ios-press flex w-[260px] items-center gap-2.5 rounded-[14px] bg-ios-bubble-light/70 p-2.5 active:bg-ios-bubble-light dark:bg-ios-bubble-dark/60 dark:active:bg-ios-bubble-dark/80",
      "aria-label": `Open ${name}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${colorClass}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5", strokeWidth: 2 }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-[13px] font-medium text-ios-label-light dark:text-ios-label-dark", children: name }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: [
            formatFileSize(size),
            " · ",
            ext.toUpperCase()
          ] })
        ] }),
        url && /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/15 dark:text-ios-blue-dark", children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4", strokeWidth: 2.2 }) })
      ]
    }
  );
}

function ImagePreview({ src, alt }) {
  const [expanded, setExpanded] = useState(false);
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (!expanded) return;
    closeBtnRef.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setExpanded(true),
        className: "block max-w-xs overflow-hidden rounded-[12px] active:opacity-90",
        "aria-label": `Expand image: ${alt}`,
        children: /* @__PURE__ */ jsx(
          "img",
          {
            src,
            alt,
            className: "max-h-64 w-full object-cover",
            loading: "lazy",
            draggable: false
          }
        )
      }
    ),
    expanded && /* @__PURE__ */ jsxs(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-ios-fade",
        role: "dialog",
        "aria-modal": "true",
        onClick: () => setExpanded(false),
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              ref: closeBtnRef,
              onClick: () => setExpanded(false),
              "aria-label": "Close image",
              className: "absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/30",
              children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5", strokeWidth: 2.5 })
            }
          ),
          /* @__PURE__ */ jsx(
            "img",
            {
              src,
              alt,
              className: "max-h-[90vh] max-w-[90vw] rounded-ios-lg object-contain",
              onClick: (e) => e.stopPropagation(),
              draggable: false
            }
          )
        ]
      }
    )
  ] });
}

function VideoPlayer({ src, name }) {
  return /* @__PURE__ */ jsx("div", { className: "max-w-sm overflow-hidden rounded-[12px]", children: /* @__PURE__ */ jsx(
    "video",
    {
      src,
      controls: true,
      playsInline: true,
      className: "w-full",
      preload: "metadata",
      "aria-label": name || "Video player",
      children: /* @__PURE__ */ jsx("p", { className: "bg-ios-fill-light p-3 text-[13px] text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark", children: "Your browser does not support video playback." })
    }
  ) });
}

function AudioPlayer({ src, name }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [seeking, setSeeking] = useState(false);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const getPercent = () => duration ? currentTime / duration * 100 : 0;
  const handleSeek = (e) => {
    if (!audioRef.current || !duration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };
  const handleMouseDown = (e) => {
    setSeeking(true);
    handleSeek(e);
  };
  useEffect(() => {
    if (!seeking) return;
    const handleMove = (e) => {
      if (!audioRef.current || !duration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = pct * duration;
      setCurrentTime(pct * duration);
    };
    const handleUp = () => setSeeking(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [seeking, duration]);
  return /* @__PURE__ */ jsxs("div", { className: "flex w-[260px] items-center gap-2.5 rounded-[16px] bg-ios-bubble-light/70 px-2.5 py-2 dark:bg-ios-bubble-dark/60", children: [
    /* @__PURE__ */ jsx(
      "audio",
      {
        ref: audioRef,
        src,
        preload: "metadata",
        onLoadedMetadata: () => setDuration(audioRef.current?.duration ?? 0),
        onTimeUpdate: () => {
          if (!seeking) setCurrentTime(audioRef.current?.currentTime ?? 0);
        },
        onEnded: () => setPlaying(false)
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: togglePlay,
        className: "ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
        "aria-label": playing ? "Pause audio" : "Play audio",
        children: playing ? /* @__PURE__ */ jsx(Pause, { className: "h-4 w-4", strokeWidth: 2.5 }) : /* @__PURE__ */ jsx(Play, { className: "h-4 w-4 ml-0.5", strokeWidth: 2.5 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "p",
        {
          className: "truncate text-[12px] font-medium text-ios-label-light dark:text-ios-label-dark",
          title: name,
          children: name
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] tabular-nums text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: formatTime(currentTime) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: progressRef,
            className: "relative h-1 flex-1 cursor-pointer rounded-full bg-ios-fill-light dark:bg-ios-fill-dark",
            onMouseDown: handleMouseDown,
            role: "slider",
            "aria-label": "Audio progress",
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": Math.round(getPercent()),
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute left-0 top-0 h-full rounded-full bg-ios-blue-light dark:bg-ios-blue-dark",
                  style: { width: `${getPercent()}%`, transition: seeking ? "none" : "width 0.08s linear" }
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 dark:bg-white",
                  style: {
                    left: `calc(${getPercent()}% - 5px)`,
                    opacity: seeking ? 1 : 0,
                    transition: seeking ? "none" : "opacity 0.2s"
                  }
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] tabular-nums text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: formatTime(duration) })
      ] })
    ] })
  ] });
}

function FileKiwiCard({ folderUrl, folderId }) {
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: folderUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "ios-press flex w-[260px] items-center gap-3 rounded-[14px] bg-ios-blue-light/12 p-3 active:bg-ios-blue-light/20 dark:bg-ios-blue-dark/20 dark:active:bg-ios-blue-dark/30",
      "aria-label": "Open file.kiwi folder",
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ios-blue-light text-white dark:bg-ios-blue-dark", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5", strokeWidth: 2.2 }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-[13px] font-semibold text-ios-blue-light dark:text-ios-blue-dark", children: "file.kiwi" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[11px] text-ios-blue-light/80 dark:text-ios-blue-dark/80", children: [
            /* @__PURE__ */ jsx(Lock, { className: "h-3 w-3", strokeWidth: 2.5 }),
            /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
              "E2E encrypted · ",
              folderId
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          ExternalLink,
          {
            className: "h-4 w-4 shrink-0 text-ios-blue-light dark:text-ios-blue-dark",
            strokeWidth: 2.5
          }
        )
      ]
    }
  );
}

const FILEKIWI_API = "https://api.file.kiwi/v2";
const KIWI_URL_RE = /^https:\/\/file\.kiwi\/([a-z0-9]+)#/;
function extractKiwiUrl(text) {
  const m = text.trim().match(KIWI_URL_RE);
  if (!m) return null;
  return { folderUrl: text.trim(), folderId: m[1] };
}
async function createEmptyFolder(title, mode = "send", retries = 3) {
  const body = {
    mode,
    encryption: { keyStrategy: "server_generated" }
  };
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(`${FILEKIWI_API}/folders`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (res.status === 429) {
    if (retries <= 0) throw new Error("file.kiwi: rate limited after 3 retries");
    await new Promise((r) => setTimeout(r, 1e3));
    return createEmptyFolder(title, mode, retries - 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`file.kiwi: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    folderId: data.folderId,
    folderUrl: data.folderUrl,
    folderUrlBase: data.folderUrlBase,
    mode: data.mode
  };
}

const MENTION_RE = /@(\w[\w.-]*\w|\w)/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/;
const BOLD_RE = /\*\*(.+?)\*\*/;
const ITALIC_RE = /\*(.+?)\*/;
const CODE_RE = /`([^`]+)`/;
const STRIKE_RE = /~(.+?)~/;
function parseSegment(text, idx) {
  const nodes = [];
  let remaining = text;
  while (remaining.length > 0) {
    const matches = [];
    const m = remaining.match(LINK_RE);
    if (m) matches.push({ index: m.index, length: m[0].length, node: React.createElement("a", { key: `l-${idx}-${m.index}`, href: m[2], target: "_blank", rel: "noopener noreferrer", className: "text-brand-500 underline hover:text-brand-400" }, m[1]) });
    const b = remaining.match(BOLD_RE);
    if (b) matches.push({ index: b.index, length: b[0].length, node: React.createElement("strong", { key: `b-${idx}-${b.index}` }, b[1]) });
    const i = remaining.match(ITALIC_RE);
    if (i) matches.push({ index: i.index, length: i[0].length, node: React.createElement("em", { key: `i-${idx}-${i.index}` }, i[1]) });
    const c = remaining.match(CODE_RE);
    if (c) matches.push({ index: c.index, length: c[0].length, node: React.createElement("code", { key: `c-${idx}-${c.index}`, className: "rounded bg-gray-200 dark:bg-[#333] px-1 text-xs font-mono" }, c[1]) });
    const s = remaining.match(STRIKE_RE);
    if (s) matches.push({ index: s.index, length: s[0].length, node: React.createElement("s", { key: `s-${idx}-${s.index}` }, s[1]) });
    const at = remaining.match(MENTION_RE);
    if (at) matches.push({ index: at.index, length: at[0].length, node: React.createElement("span", { key: `m-${idx}-${at.index}`, className: "font-semibold text-brand-600 dark:text-brand-400" }, at[0]) });
    if (matches.length === 0) {
      const parts = remaining.split(/(\n\n+)/);
      for (let p = 0; p < parts.length; p++) {
        if (p % 2 === 0) {
          nodes.push(parts[p]);
        } else {
          nodes.push(React.createElement("br", { key: `br-${idx}-${p}` }), React.createElement("br", { key: `br2-${idx}-${p}` }));
        }
      }
      break;
    }
    matches.sort((a, b2) => a.index - b2.index);
    const first = matches[0];
    if (first.index > 0) {
      nodes.push(remaining.slice(0, first.index));
    }
    nodes.push(first.node);
    remaining = remaining.slice(first.index + first.length);
  }
  return nodes;
}
function RichText({ text }) {
  const segments = text.split(/(\n\n+)/);
  const nodes = [];
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) {
      const parsed = parseSegment(segments[i], i);
      for (const n of parsed) nodes.push(n);
    } else {
      nodes.push(React.createElement("br", { key: `br-${i}` }), React.createElement("br", { key: `br2-${i}` }));
    }
  }
  return React.createElement(React.Fragment, null, ...nodes);
}

function ConfirmDeleteModal({
  open,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
  title = "Delete message",
  message = "How do you want to delete this message?"
}) {
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade",
      role: "dialog",
      "aria-modal": "true",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ jsxs("div", { className: "w-full max-h-[90dvh] overflow-hidden rounded-t-ios-xl bg-ios-grouped-light shadow-ios-sheet dark:bg-ios-grouped-dark animate-ios-slide-up", children: [
        /* @__PURE__ */ jsx("div", { className: "ios-sheet-grabber", "aria-hidden": true }),
        /* @__PURE__ */ jsxs("div", { className: "px-4 pt-2 pb-2 text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 px-4 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: message })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ios-action-group", children: [
          onDeleteForEveryone && /* @__PURE__ */ jsxs("button", { onClick: onDeleteForEveryone, className: "ios-action ios-action-destructive", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "h-[18px] w-[18px]" }),
            /* @__PURE__ */ jsx("span", { children: "Delete for everyone" })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: onDeleteForMe, className: "ios-action ios-action-destructive", children: [
            /* @__PURE__ */ jsx(Trash2, { className: "h-[18px] w-[18px]" }),
            /* @__PURE__ */ jsx("span", { children: "Delete for me" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "ios-action-group ios-action-cancel-group", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "ios-action ios-action-cancel", children: /* @__PURE__ */ jsx("span", { children: "Cancel" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })
      ] })
    }
  );
}

const QUICK_EMOJIS = ["❤️", "👍", "😂", "‼️", "❓"];
function MessageItem({
  message,
  isOwn,
  isGroup,
  showSender,
  currentUserId,
  onReply,
  onForward,
  onRetry,
  groupedPrev,
  groupedNext,
  isLastInGroup = true,
  onJumpToMessage
}) {
  const [attachments, setAttachments] = useState([]);
  const [signedUrls, setSignedUrls] = useState(/* @__PURE__ */ new Map());
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content ?? "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [reactions, setReactions] = useState(message.reactions ?? []);
  const [_readReceipts] = useState(message.read_receipts ?? []);
  const [pinnedId, setPinnedId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletedLocally, setDeletedLocally] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const editRef = useRef(null);
  const longPressTimer = useRef(null);
  useEffect(() => {
    if (!message.id) return;
    let cancelled = false;
    supabase.from("attachments").select("*").eq("message_id", message.id).then(async ({ data }) => {
      if (!data?.length || cancelled) return;
      setAttachments(data);
      const paths = data.map((att) => att.storage_path);
      const { data: signedData } = await supabase.storage.from("attachments").createSignedUrls(paths, 3600);
      if (cancelled) return;
      const urlMap = /* @__PURE__ */ new Map();
      for (const row of signedData ?? []) {
        if (row.signedUrl && row.path) urlMap.set(row.path, row.signedUrl);
      }
      setSignedUrls(urlMap);
    });
    supabase.from("pinned_messages").select("id").eq("message_id", message.id).limit(1).then(({ data }) => {
      if (data?.length && !cancelled) setPinnedId(data[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, [message.id]);
  useEffect(() => {
    if (!attachments.length) return;
    const refresh = async () => {
      const paths = attachments.map((att) => att.storage_path);
      const { data } = await supabase.storage.from("attachments").createSignedUrls(paths, 3600);
      if (!data) return;
      const urlMap = /* @__PURE__ */ new Map();
      for (const row of data) if (row.signedUrl && row.path) urlMap.set(row.path, row.signedUrl);
      setSignedUrls(urlMap);
    };
    const interval = setInterval(refresh, 50 * 60 * 1e3);
    return () => clearInterval(interval);
  }, [attachments]);
  const replyMsg = message.reply_to ?? null;
  const handleSaveEdit = async () => {
    if (!editText.trim() || !message.id) return;
    setSavingEdit(true);
    try {
      await editMessage(message.id, editText.trim());
      setEditing(false);
    } catch (e) {
      console.error("Failed to edit message:", e);
      setEditText(message.content ?? "");
    } finally {
      setSavingEdit(false);
    }
  };
  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(message.content ?? "");
  };
  const handleReaction = async (emoji) => {
    setReactionPickerOpen(false);
    setContextMenu(null);
    try {
      const added = await toggleReaction(message.id, currentUserId, emoji);
      if (added) {
        setReactions((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message_id: message.id,
            user_id: currentUserId,
            emoji,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            profile: { id: currentUserId, full_name: "You" }
          }
        ]);
      } else {
        setReactions(
          (prev) => prev.filter((r) => !(r.emoji === emoji && r.user_id === currentUserId))
        );
      }
    } catch (e) {
      console.error("Failed to toggle reaction:", e);
    }
  };
  const handlePin = async () => {
    setContextMenu(null);
    if (!message.id || !message.conversation_id) return;
    try {
      if (pinnedId) {
        await unpinMessage(pinnedId);
        setPinnedId(null);
      } else {
        await pinMessage(message.conversation_id, message.id, currentUserId);
        setPinnedId("pending");
        const { data } = await supabase.from("pinned_messages").select("id").eq("message_id", message.id).single();
        if (data) setPinnedId(data.id);
      }
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };
  const handleContextAction = (action) => {
    setContextMenu(null);
    setReactionPickerOpen(false);
    action();
  };
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setReactionPickerOpen(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  const emojiGroups = useMemo(() => {
    return reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
      acc[r.emoji].count++;
      if (r.user_id === currentUserId) acc[r.emoji].mine = true;
      return acc;
    }, {});
  }, [reactions, currentUserId]);
  const seenBy = _readReceipts.filter((r) => r.profile?.full_name).slice(0, 3).map((r) => r.profile.full_name);
  if (message.deleted_at || deletedLocally) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: `flex ${isOwn ? "justify-end" : "justify-start"} ${groupedNext ? "" : "pb-1"} ${groupedPrev ? "pt-0.5" : "pt-2"} px-3`,
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: `rounded-[16px] bg-ios-bubble-light px-3 py-1.5 text-[13px] italic text-ios-secondary_label-light dark:bg-ios-bubble-dark dark:text-ios-secondary_label-dark ${isOwn ? "rounded-br-[4px]" : "rounded-bl-[4px]"}`,
            children: "This message was deleted"
          }
        )
      }
    );
  }
  const bubbleClass = [
    "ios-bubble",
    isOwn ? "ios-bubble-own" : "ios-bubble-other",
    groupedPrev && (isOwn ? "ios-bubble-grouped-prev" : "ios-bubble-grouped-prev"),
    groupedNext && (isOwn ? "ios-bubble-grouped-next" : "ios-bubble-grouped-next")
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `group relative flex ${isOwn ? "justify-end" : "justify-start"} ${groupedNext ? "" : "pb-1"} ${groupedPrev ? "pt-0.5" : "pt-2"} px-3`,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onContextMenu: (e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex max-w-[78%] flex-col", style: { alignItems: isOwn ? "flex-end" : "flex-start" }, children: [
          !isOwn && isGroup && showSender && !editing && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onJumpToMessage?.(message.id),
              className: "ios-press mb-0.5 ml-3 text-[12px] font-medium text-ios-secondary_label-light active:opacity-60 dark:text-ios-secondary_label-dark",
              children: message.sender?.full_name ?? "Unknown"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: bubbleClass, children: [
            pinnedId && /* @__PURE__ */ jsxs(
              "div",
              {
                className: `mb-1 flex items-center gap-1 text-[11px] ${isOwn ? "text-white/85" : "text-ios-secondary_label-light dark:text-ios-secondary_label-dark"}`,
                children: [
                  /* @__PURE__ */ jsx(Pin, { className: "h-3 w-3", strokeWidth: 2.5 }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Pinned" })
                ]
              }
            ),
            message.forwarded_from && !message.forwarded_from.deleted_at && /* @__PURE__ */ jsxs(
              "div",
              {
                className: `mb-1 flex items-center gap-1 text-[11px] ${isOwn ? "text-white/85" : "text-ios-secondary_label-light dark:text-ios-secondary_label-dark"}`,
                children: [
                  /* @__PURE__ */ jsx(Forward, { className: "h-3 w-3", strokeWidth: 2.5 }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    "Forwarded from ",
                    message.forwarded_from.sender?.full_name ?? "Unknown"
                  ] })
                ]
              }
            ),
            !editing && message.reply_to_id && replyMsg && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onJumpToMessage?.(message.reply_to_id),
                className: `mb-1.5 flex w-full max-w-full items-center gap-2 rounded-[12px] px-2.5 py-1.5 text-left text-[13px] ${isOwn ? "bg-white/15 text-white" : "bg-black/5 text-ios-label-light dark:bg-white/8 dark:text-ios-label-dark"}`,
                children: [
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `h-7 w-0.5 shrink-0 rounded-full ${isOwn ? "bg-white/60" : "bg-ios-blue-light dark:bg-ios-blue-dark"}`
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx(
                      "p",
                      {
                        className: `truncate text-[12px] font-semibold ${isOwn ? "text-white/85" : "text-ios-blue-light dark:text-ios-blue-dark"}`,
                        children: replyMsg?.sender?.full_name ?? (replyMsg?.sender_id === currentUserId ? "You" : "Unknown")
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "p",
                      {
                        className: `truncate ${isOwn ? "text-white/75" : "text-ios-secondary_label-light dark:text-ios-secondary_label-dark"}`,
                        children: replyMsg?.deleted_at ? "Message deleted" : replyMsg?.content || (replyMsg?.attachments?.length ? "📎 Attachment" : "…")
                      }
                    )
                  ] })
                ]
              }
            ),
            editing ? /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  ref: editRef,
                  value: editText,
                  onChange: (e) => setEditText(e.target.value),
                  className: `w-full resize-none rounded-[10px] bg-white px-2.5 py-1.5 text-[15px] text-ios-label-light focus:outline-none dark:bg-black dark:text-ios-label-dark`,
                  rows: 2,
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1.5", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleCancelEdit,
                    "aria-label": "Cancel edit",
                    className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-ios-label-light active:bg-black/20 dark:bg-white/15 dark:text-white",
                    children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5", strokeWidth: 2.5 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleSaveEdit,
                    disabled: !editText.trim() || savingEdit,
                    "aria-label": "Save edit",
                    className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark",
                    children: /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5", strokeWidth: 3 })
                  }
                )
              ] })
            ] }) : message.content ? (() => {
              const kiwi = extractKiwiUrl(message.content);
              if (kiwi) {
                return /* @__PURE__ */ jsx(FileKiwiCard, { folderUrl: kiwi.folderUrl, folderId: kiwi.folderId });
              }
              return /* @__PURE__ */ jsxs("div", { className: "text-[15px] leading-[1.35] tracking-[-0.2px]", children: [
                /* @__PURE__ */ jsx(RichText, { text: message.content }),
                message.is_edited && /* @__PURE__ */ jsx("span", { className: "ios-bubble-edited", children: "edited" })
              ] });
            })() : null,
            !editing && attachments.map((att) => {
              const url = signedUrls.get(att.storage_path);
              if (!url) return null;
              const ext = att.extension.toLowerCase();
              if (isImage(ext)) {
                return /* @__PURE__ */ jsx("div", { className: "ios-bubble-attachment mt-1 first:mt-0", children: /* @__PURE__ */ jsx(ImagePreview, { src: url, alt: att.original_name }) }, att.id);
              }
              if (isVideo(ext)) {
                return /* @__PURE__ */ jsx("div", { className: "ios-bubble-attachment mt-1 first:mt-0", children: /* @__PURE__ */ jsx(VideoPlayer, { src: url, name: att.original_name }) }, att.id);
              }
              if (isAudio(ext)) {
                return /* @__PURE__ */ jsx("div", { className: "mt-1 first:mt-0", children: /* @__PURE__ */ jsx(AudioPlayer, { src: url, name: att.original_name }) }, att.id);
              }
              return /* @__PURE__ */ jsx("div", { className: "mt-1 first:mt-0", children: /* @__PURE__ */ jsx(FileCard, { name: att.original_name, size: att.file_size, extension: ext, url }) }, att.id);
            }),
            !editing && /* @__PURE__ */ jsxs("div", { className: "ios-bubble-meta", children: [
              message.expires_at && /* @__PURE__ */ jsx(Timer, { className: "h-3 w-3 opacity-80", strokeWidth: 2.5 }),
              /* @__PURE__ */ jsx("span", { children: formatTimeShort(message.created_at) }),
              isOwn && seenBy.length > 0 ? /* @__PURE__ */ jsx(
                "span",
                {
                  title: `Seen by ${seenBy.join(", ")}${_readReceipts.length > 3 ? ` +${_readReceipts.length - 3}` : ""}`,
                  "aria-label": `Seen by ${seenBy.join(", ")}`,
                  children: /* @__PURE__ */ jsx(CheckCheck, { className: "h-3.5 w-3.5", strokeWidth: 2.5 })
                }
              ) : isOwn && message.status === "sending" ? /* @__PURE__ */ jsx(
                "span",
                {
                  className: "inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80",
                  "aria-label": "Sending"
                }
              ) : isOwn && message.status === "failed" ? /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => onRetry?.(message),
                  title: "Tap to retry",
                  "aria-label": "Retry sending message",
                  children: /* @__PURE__ */ jsx(AlertCircle, { className: "h-3.5 w-3.5 text-ios-red-light dark:text-ios-red-dark", strokeWidth: 2.5 })
                }
              ) : isOwn && message.status === "sent" ? /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5 opacity-80", strokeWidth: 2.5 }) : null
            ] })
          ] }),
          !editing && Object.keys(emojiGroups).length > 0 && /* @__PURE__ */ jsx(
            "div",
            {
              className: `mt-0.5 flex flex-wrap gap-1 ${isOwn ? "justify-end" : "justify-start"}`,
              children: Object.entries(emojiGroups).map(([emoji, { count, mine }]) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleReaction(emoji),
                  className: `ios-reaction ${mine ? "is-mine" : ""}`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[13px]", children: emoji }),
                    count > 1 && /* @__PURE__ */ jsx("span", { className: "text-[11px]", children: count })
                  ]
                },
                emoji
              ))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `pointer-events-none absolute -top-3 z-10 hidden gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 md:flex ${isOwn ? "right-3" : "left-3"}`,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => onReply(message),
                  className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark",
                  title: "Reply",
                  "aria-label": "Reply",
                  children: /* @__PURE__ */ jsx(Reply, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                }
              ),
              isOwn && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setEditing(true),
                  className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark",
                  title: "Edit",
                  "aria-label": "Edit",
                  children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => onForward(message),
                  className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-secondary_label-light shadow-ios active:bg-ios-fill-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark",
                  title: "Forward",
                  "aria-label": "Forward",
                  children: /* @__PURE__ */ jsx(Forward, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handlePin,
                  className: `ios-press flex h-7 w-7 items-center justify-center rounded-full shadow-ios active:bg-ios-fill-light dark:active:bg-ios-fill-dark ${pinnedId ? "bg-ios-blue-light text-white dark:bg-ios-blue-dark" : "bg-ios-bg-light text-ios-secondary_label-light dark:bg-ios-secondary-dark dark:text-ios-secondary_label-dark"}`,
                  title: pinnedId ? "Unpin" : "Pin",
                  "aria-label": pinnedId ? "Unpin" : "Pin",
                  children: pinnedId ? /* @__PURE__ */ jsx(PinOff, { className: "h-3.5 w-3.5", strokeWidth: 2.2 }) : /* @__PURE__ */ jsx(Pin, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                }
              ),
              isOwn && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setDeleteConfirmOpen(true),
                  className: "ios-press flex h-7 w-7 items-center justify-center rounded-full bg-ios-bg-light text-ios-red-light shadow-ios active:bg-ios-red-light/10 dark:bg-ios-secondary-dark dark:text-ios-red-dark",
                  title: "Delete",
                  "aria-label": "Delete",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                }
              )
            ]
          }
        ),
        reactionPickerOpen && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute -top-12 left-1/2 z-30 -translate-x-1/2 animate-ios-pop",
            onClick: (e) => e.stopPropagation(),
            children: /* @__PURE__ */ jsx("div", { className: "ios-reaction-popover", children: QUICK_EMOJIS.map((emoji) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleReaction(emoji),
                className: "flex h-8 w-8 items-center justify-center rounded-full text-[18px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
                children: emoji
              },
              emoji
            )) })
          }
        ),
        contextMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "fixed inset-0 z-40",
              onClick: () => setContextMenu(null),
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "ios-action-group fixed z-50 w-56 animate-ios-pop !m-0",
              style: {
                left: Math.min(contextMenu.x, window.innerWidth - 240),
                top: Math.min(contextMenu.y, window.innerHeight - 280)
              },
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex justify-around bg-ios-bg-light px-2 py-1.5 dark:bg-ios-secondary-dark", children: QUICK_EMOJIS.map((emoji) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleReaction(emoji),
                    className: "flex h-9 w-9 items-center justify-center rounded-full text-[20px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
                    children: emoji
                  },
                  emoji
                )) }),
                /* @__PURE__ */ jsx("div", { className: "ios-hairline" }),
                /* @__PURE__ */ jsxs("button", { onClick: () => handleContextAction(() => onReply(message)), className: "ios-action", children: [
                  /* @__PURE__ */ jsx(Reply, { className: "h-[18px] w-[18px]" }),
                  " Reply"
                ] }),
                isOwn && /* @__PURE__ */ jsxs("button", { onClick: () => handleContextAction(() => setEditing(true)), className: "ios-action", children: [
                  /* @__PURE__ */ jsx(Pencil, { className: "h-[18px] w-[18px]" }),
                  " Edit"
                ] }),
                /* @__PURE__ */ jsxs("button", { onClick: () => handleContextAction(() => onForward(message)), className: "ios-action", children: [
                  /* @__PURE__ */ jsx(Forward, { className: "h-[18px] w-[18px]" }),
                  " Forward"
                ] }),
                /* @__PURE__ */ jsxs("button", { onClick: handlePin, className: "ios-action", children: [
                  pinnedId ? /* @__PURE__ */ jsx(PinOff, { className: "h-[18px] w-[18px]" }) : /* @__PURE__ */ jsx(Pin, { className: "h-[18px] w-[18px]" }),
                  pinnedId ? "Unpin" : "Pin"
                ] }),
                isOwn && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleContextAction(() => setDeleteConfirmOpen(true)),
                    className: "ios-action ios-action-destructive",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { className: "h-[18px] w-[18px]" }),
                      " Delete"
                    ]
                  }
                )
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          ConfirmDeleteModal,
          {
            open: deleteConfirmOpen,
            onClose: () => setDeleteConfirmOpen(false),
            onDeleteForMe: () => {
              setDeletedLocally(true);
              setDeleteConfirmOpen(false);
            },
            onDeleteForEveryone: message.sender_id === currentUserId ? () => {
              deleteMessage(message.id);
              setDeleteConfirmOpen(false);
            } : void 0
          }
        )
      ]
    }
  );
}

function isSameDay(a, b) {
  return a?.slice(0, 10) === b?.slice(0, 10);
}
function isGrouped(prev, curr) {
  if (!prev) return false;
  if (prev.sender_id !== curr.sender_id) return false;
  if (curr.deleted_at) return false;
  const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 3e5;
}
function MessageList({
  messages,
  loading,
  hasMore,
  currentUserId,
  conversationId,
  isGroup,
  onLoadMore,
  onReply,
  onForward,
  onRetry,
  onJumpToMessage
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const isFirstLoad = useRef(true);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const isNearBottomRef = useRef(true);
  const messageRefs = useRef(/* @__PURE__ */ new Map());
  const [highlightId, setHighlightId] = useState(null);
  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 150;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isNearBottomRef.current = near;
    if (near) setShowNewMsg(false);
  }, []);
  useEffect(() => {
    if (isFirstLoad.current && !loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
      isFirstLoad.current = false;
    } else if (messages.length > prevLengthRef.current) {
      const diff = messages.length - prevLengthRef.current;
      if (diff === 1 && isNearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (diff > 0 && !isNearBottomRef.current) {
        setShowNewMsg(true);
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, loading]);
  useEffect(() => {
    if (!conversationId) return;
    getPinnedMessages(conversationId).then(setPinnedMessages);
  }, [conversationId]);
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    if (containerRef.current.scrollTop < 100) onLoadMore();
    checkNearBottom();
  }, [loading, hasMore, onLoadMore, checkNearBottom]);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMsg(false);
  };
  const handleJump = useCallback(
    (id) => {
      const el = messageRefs.current.get(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightId(id);
        setTimeout(() => setHighlightId(null), 1200);
      }
    },
    []
  );
  const handlePinnedClick = useCallback(
    (id) => {
      handleJump(id);
    },
    [handleJump]
  );
  const orderedMessages = useMemo(() => messages, [messages]);
  if (loading && messages.length === 0) return /* @__PURE__ */ jsx("div", { className: "flex flex-1 flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark", children: /* @__PURE__ */ jsx(MessageSkeleton, {}) });
  if (messages.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-center bg-ios-grouped-light dark:bg-ios-grouped-dark", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ios-fill-light dark:bg-ios-fill-dark", children: /* @__PURE__ */ jsx(
        MessageCircle,
        {
          className: "h-7 w-7 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
          strokeWidth: 1.8
        }
      ) }),
      /* @__PURE__ */ jsx("p", { className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: "No Messages Yet" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Send a message to start the conversation" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative flex flex-1 flex-col bg-ios-grouped-light dark:bg-ios-grouped-dark", children: [
    pinnedMessages.length > 0 && /* @__PURE__ */ jsxs("div", { className: "ios-blur sticky top-0 z-10 mx-3 mt-2 flex items-center gap-2 overflow-hidden rounded-ios-lg border border-ios-separator-light bg-ios-bg-light/85 px-3 py-2 shadow-ios-sm dark:border-ios-separator-dark dark:bg-ios-secondary-dark/85", children: [
      /* @__PURE__ */ jsx(Pin, { className: "h-3.5 w-3.5 shrink-0 text-ios-blue-light dark:text-ios-blue-dark", strokeWidth: 2.5 }),
      /* @__PURE__ */ jsx("p", { className: "shrink-0 text-[12px] font-semibold text-ios-blue-light dark:text-ios-blue-dark", children: "Pinned" }),
      /* @__PURE__ */ jsx("div", { className: "h-3 w-px shrink-0 bg-ios-separator-light dark:bg-ios-separator-dark" }),
      /* @__PURE__ */ jsx("p", { className: "line-clamp-1 flex-1 text-[13px] text-ios-label-light dark:text-ios-label-dark", children: pinnedMessages[0]?.message?.content ?? (pinnedMessages[0]?.message?.attachments?.length ? "📎 Attachment" : "Message") }),
      pinnedMessages[0] && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handlePinnedClick(pinnedMessages[0].message_id),
          className: "ios-press shrink-0 text-[12px] font-medium text-ios-blue-light active:opacity-60 dark:text-ios-blue-dark",
          children: "View"
        }
      ),
      pinnedMessages.length > 1 && /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: [
        "+",
        pinnedMessages.length - 1
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: containerRef,
        onScroll: handleScroll,
        className: "ios-chat-area flex-1 overflow-y-auto py-2 scrollbar-thin",
        role: "log",
        "aria-live": "polite",
        "aria-relevant": "additions",
        children: [
          loading && hasMore && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-2", children: /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin text-ios-secondary_label-light dark:text-ios-secondary_label-dark" }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-0", children: orderedMessages.map((msg, i) => {
            const prev = i > 0 ? orderedMessages[i - 1] : void 0;
            const next = i < orderedMessages.length - 1 ? orderedMessages[i + 1] : void 0;
            const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at);
            const groupedPrev = isGrouped(prev, msg);
            const groupedNext = !!next && isGrouped(msg, next);
            const isHighlighted = highlightId === msg.id;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                ref: (el) => {
                  if (el) messageRefs.current.set(msg.id, el);
                  else messageRefs.current.delete(msg.id);
                },
                className: isHighlighted ? "animate-ios-fade" : "",
                children: [
                  showDateSep && /* @__PURE__ */ jsx("div", { className: "my-3 flex items-center justify-center px-3", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "rounded-full bg-ios-fill-light px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark",
                      style: { letterSpacing: "0.06em" },
                      children: formatDateSeparator(msg.created_at)
                    }
                  ) }),
                  showDateSep && /* @__PURE__ */ jsx("div", { className: "-mt-1 mb-1 flex justify-center", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-ios-fill-light/80 px-2 py-0.5 text-[10px] text-ios-secondary_label-light dark:bg-ios-fill-dark/80 dark:text-ios-secondary_label-dark", children: formatTimeShort(msg.created_at) }) }),
                  /* @__PURE__ */ jsx(
                    MessageItem,
                    {
                      message: msg,
                      isOwn: msg.sender_id === currentUserId,
                      isGroup,
                      showSender: isGroup && !groupedPrev,
                      currentUserId,
                      onReply,
                      onForward,
                      onRetry,
                      groupedPrev,
                      groupedNext,
                      onJumpToMessage: onJumpToMessage ? handleJump : void 0
                    }
                  )
                ]
              },
              msg.id
            );
          }) }),
          /* @__PURE__ */ jsx("div", { ref: bottomRef, className: "h-1" })
        ]
      }
    ),
    showNewMsg && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: scrollToBottom,
        className: "ios-press absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ios-blue-light px-3.5 py-1.5 text-[13px] font-medium text-white shadow-ios active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
        "aria-label": "Scroll to new messages",
        children: [
          /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5", strokeWidth: 3 }),
          "New messages"
        ]
      }
    )
  ] });
}

const BUCKET = "attachments";
const SIGNED_URL_EXPIRY = 3600;
let bucketInitialized = false;
async function ensureBucket() {
  if (bucketInitialized) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error) console.error("Failed to create storage bucket:", error);
  }
  bucketInitialized = true;
}
const supabaseStorage = {
  async uploadFile(file, path, onProgress) {
    await ensureBucket();
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      cacheControl: "3600"
    });
    if (error) throw error;
    if (onProgress) onProgress(100);
    const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRY);
    return {
      path: data.path,
      url: urlData?.signedUrl ?? ""
    };
  },
  async deleteFile(path) {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  },
  async getDownloadUrl(path) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRY);
    return data?.signedUrl ?? "";
  },
  async getPreviewUrl(path) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRY);
    return data?.signedUrl ?? "";
  }
};

let storageProvider = supabaseStorage;

function ReplyPreview({ message, onCancel }) {
  const ref = useRef(null);
  const senderName = message.sender?.full_name ?? "Someone";
  const [thumbUrl, setThumbUrl] = useState(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  useEffect(() => {
    if (!message.id) return;
    let cancelled = false;
    supabase.from("attachments").select("storage_path, extension").eq("message_id", message.id).then(async ({ data }) => {
      if (!data?.length || cancelled) return;
      const imgAtt = data.find((a) => isImage(a.extension));
      if (!imgAtt) return;
      const { data: signed } = await supabase.storage.from("attachments").createSignedUrls([imgAtt.storage_path], 3600);
      if (signed?.[0]?.signedUrl && !cancelled) setThumbUrl(signed[0].signedUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [message.id]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: "flex items-center gap-2.5 border-t border-ios-separator-light bg-ios-grouped-light px-3 pb-1.5 pt-2 dark:border-ios-separator-dark dark:bg-ios-grouped-dark",
      children: [
        thumbUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            src: thumbUrl,
            alt: "",
            className: "h-9 w-9 shrink-0 rounded-[8px] object-cover"
          }
        ) : /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-ios-fill-light dark:bg-ios-fill-dark", children: /* @__PURE__ */ jsx(
          Reply,
          {
            className: "h-4 w-4 text-ios-blue-light dark:text-ios-blue-dark",
            strokeWidth: 2.2
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 border-l-2 border-ios-blue-light pl-2.5 dark:border-ios-blue-dark", children: [
          /* @__PURE__ */ jsxs("p", { className: "truncate text-[12px] font-semibold text-ios-blue-light dark:text-ios-blue-dark", children: [
            "Replying to ",
            senderName
          ] }),
          /* @__PURE__ */ jsx("p", { className: "truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: message.deleted_at ? "Message deleted" : message.content || (thumbUrl ? "Photo" : message.attachments?.length ? "Attachment" : "…") })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onCancel,
            "aria-label": "Cancel reply",
            className: "ios-press flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4", strokeWidth: 2.5 })
          }
        )
      ]
    }
  );
}

const CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🥸",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🤬",
      "🤯",
      "😳",
      "🥵",
      "🥶",
      "😱",
      "😨",
      "😰",
      "😥",
      "😓",
      "🤗",
      "🤔",
      "🤭",
      "🤫",
      "🤥",
      "😶",
      "😐",
      "😑",
      "😬",
      "🙄",
      "😯",
      "😦",
      "😧",
      "😮",
      "😲",
      "🥱",
      "😴",
      "🤤",
      "😪",
      "😵",
      "🤐",
      "🥴",
      "🤢",
      "🤮",
      "🤧",
      "😷",
      "🤒",
      "🤕"
    ]
  },
  {
    name: "Gestures",
    emojis: [
      "👋",
      "🤚",
      "✋",
      "🖐",
      "✌️",
      "🤞",
      "🫰",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💪"
    ]
  },
  {
    name: "Hearts",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "💑",
      "💏"
    ]
  },
  {
    name: "Animals",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐒",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🐣",
      "🐥",
      "🦆",
      "🦅",
      "🦉",
      "🐺",
      "🐗",
      "🐴",
      "🦄",
      "🐝",
      "🐛",
      "🦋",
      "🐌",
      "🐞",
      "🐢",
      "🐍",
      "🦎",
      "🐙",
      "🦑",
      "🦐",
      "🦀",
      "🐠",
      "🐬",
      "🐳",
      "🐋",
      "🦈"
    ]
  },
  {
    name: "Food",
    emojis: [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥕",
      "🌽",
      "🍞",
      "🥐",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🥪",
      "🌮",
      "🌯",
      "🥗",
      "🍝",
      "🍜",
      "🍲",
      "🍣",
      "🍱",
      "🥟",
      "🍤",
      "🍙",
      "🍚",
      "🍘",
      "🍥",
      "🍢",
      "🍡",
      "🍧",
      "🍨",
      "🍦",
      "🥧",
      "🧁",
      "🍰",
      "🎂",
      "🍮",
      "🍭",
      "🍬",
      "🍫",
      "🍿",
      "🍩",
      "🍪",
      "🌰",
      "🥜",
      "☕",
      "🍵",
      "🥤",
      "🍶",
      "🍺",
      "🍻",
      "🥂",
      "🍷",
      "🥃",
      "🍸",
      "🍹",
      "🍾"
    ]
  },
  {
    name: "Travel",
    emojis: [
      "🌍",
      "🌎",
      "🌏",
      "🌐",
      "🗺️",
      "🧭",
      "🏔️",
      "⛰️",
      "🌋",
      "🏕️",
      "🏖️",
      "🏜️",
      "🏝️",
      "🏞️",
      "🏟️",
      "🏛️",
      "🏗️",
      "🏠",
      "🏡",
      "🏢",
      "🏣",
      "🏥",
      "🏦",
      "🏨",
      "🏩",
      "🏪",
      "🏫",
      "🏬",
      "🏭",
      "🏯",
      "🏰",
      "💒",
      "🗼",
      "🗽",
      "⛪",
      "🕌",
      "🛕",
      "⛲",
      "🌁",
      "🌃",
      "🏙️",
      "🌄",
      "🌅",
      "🌆",
      "🌇",
      "🌉",
      "🗾"
    ]
  },
  {
    name: "Objects",
    emojis: [
      "⌚",
      "📱",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "🖱️",
      "💽",
      "💾",
      "💿",
      "📀",
      "📷",
      "📸",
      "📹",
      "🎥",
      "📞",
      "☎️",
      "📺",
      "📻",
      "🎙️",
      "⏰",
      "🕰️",
      "⌛",
      "⏳",
      "🔋",
      "🔌",
      "💡",
      "🔦",
      "🕯️",
      "💸",
      "💵",
      "💴",
      "💶",
      "💷",
      "💰",
      "💳",
      "💎",
      "⚖️",
      "🔧",
      "🔨",
      "⚒️",
      "🛠️",
      "⛏️",
      "🔩",
      "⚙️",
      "🧰",
      "🧲",
      "🔫",
      "💣",
      "🔪",
      "📜",
      "📃",
      "📄",
      "📑",
      "📊",
      "📈",
      "📉",
      "📆",
      "📅",
      "📇",
      "📋",
      "📁",
      "📂",
      "📰",
      "📓",
      "📔",
      "📒",
      "📕",
      "📗",
      "📘",
      "📙",
      "📚",
      "📖",
      "🔖",
      "📌",
      "📍",
      "✂️",
      "📝",
      "🔍",
      "🔎",
      "🔏",
      "🔐",
      "🔒",
      "🔓"
    ]
  },
  {
    name: "Symbols",
    emojis: [
      "❤️",
      "🔥",
      "✨",
      "⭐",
      "🎉",
      "🎊",
      "💯",
      "✅",
      "❌",
      "❓",
      "❗",
      "💢",
      "💤",
      "💬",
      "💭",
      "🗯️",
      "♻️",
      "⚠️",
      "🚫",
      "🔞",
      "📵",
      "🚭",
      "❕",
      "❔",
      "‼️",
      "⁉️",
      "💹",
      "💠",
      "🔘",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
      "🔵",
      "🟣",
      "⚫",
      "⚪",
      "🟤"
    ]
  }
];
const ALL_EMOJIS = CATEGORIES.flatMap((c) => c.emojis);
function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  const filtered = search.trim() ? ALL_EMOJIS.filter((e) => e.includes(search)) : CATEGORIES[activeCategory].emojis;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: pickerRef,
      className: "absolute bottom-full left-0 mb-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios-lg dark:bg-ios-secondary-dark animate-ios-pop",
      role: "dialog",
      "aria-label": "Emoji picker",
      children: [
        /* @__PURE__ */ jsx("div", { className: "border-b border-ios-separator-light p-2 dark:border-ios-separator-dark", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Search,
            {
              className: "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
              strokeWidth: 2.5
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search emoji",
              className: "h-8 w-full rounded-[8px] bg-ios-fill-light pl-8 pr-3 text-[14px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/30 dark:bg-ios-fill-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark",
              "aria-label": "Search emoji"
            }
          )
        ] }) }),
        !search.trim() && /* @__PURE__ */ jsx("div", { className: "flex gap-0.5 overflow-x-auto border-b border-ios-separator-light px-2 py-1.5 scrollbar-thin dark:border-ios-separator-dark", children: CATEGORIES.map((cat, i) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveCategory(i),
            className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] transition-colors ${i === activeCategory ? "bg-ios-blue-light/15 dark:bg-ios-blue-dark/25" : "active:bg-ios-fill-light dark:active:bg-ios-fill-dark"}`,
            "aria-label": cat.name,
            title: cat.name,
            children: cat.emojis[0]
          },
          cat.name
        )) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-8 gap-0.5 p-1.5 max-h-56 overflow-y-auto scrollbar-thin", children: filtered.map((emoji) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              onSelect(emoji);
              onClose();
            },
            className: "flex h-8 w-8 items-center justify-center rounded-[8px] text-[20px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
            "aria-label": emoji,
            children: emoji
          },
          emoji
        )) })
      ]
    }
  );
}

async function uploadFileToStorage(file, conversationId) {
  const storagePath = generateStoragePath(conversationId, file.name);
  const ext = getExtension(file.name);
  const result = await storageProvider.uploadFile(file, storagePath);
  return {
    storage_path: result.path,
    original_name: file.name,
    mime_type: file.type || "application/octet-stream",
    extension: ext,
    file_size: file.size
  };
}
function MessageComposerInner({
  conversationId,
  sending,
  replyTo,
  onCancelReply,
  onSendMessage,
  onSendWithAttachments,
  onTyping
}) {
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [kiwiLoading, setKiwiLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const dragCountRef = useRef(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const handleSendRef = useRef(async () => {
  });
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  const handleSend = useCallback(async () => {
    if (!text.trim() && uploads.length === 0 || uploading || sending) return;
    setUploading(true);
    const attachmentResults = [];
    for (const item of uploads) {
      setUploads(
        (prev) => prev.map((u) => u.id === item.id ? { ...u, status: "uploading" } : u)
      );
      try {
        const uploaded = await uploadFileToStorage(item.file, conversationId);
        attachmentResults.push(uploaded);
        setUploads(
          (prev) => prev.map((u) => u.id === item.id ? { ...u, status: "done" } : u)
        );
      } catch (err) {
        console.error("File upload failed:", err);
        setUploads(
          (prev) => prev.map((u) => u.id === item.id ? { ...u, status: "error" } : u)
        );
      }
    }
    const content = text.trim();
    const replyToId = replyTo?.id ?? null;
    if (attachmentResults.length > 0) {
      onSendWithAttachments(content, attachmentResults, replyToId);
    } else if (content) {
      onSendMessage(content, replyToId);
    }
    if (replyTo && (content || attachmentResults.length > 0)) {
      onCancelReply();
    }
    setText("");
    setUploads([]);
    setUploading(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [
    text,
    uploads,
    uploading,
    sending,
    conversationId,
    replyTo,
    onSendWithAttachments,
    onSendMessage,
    onCancelReply
  ]);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleChange = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3e3);
  };
  const handleKiwiShare = async () => {
    if (kiwiLoading) return;
    setKiwiLoading(true);
    try {
      const { folderUrl } = await createEmptyFolder();
      onSendMessage(folderUrl, replyTo?.id ?? null);
      if (replyTo) onCancelReply();
    } catch (e) {
      console.error("file.kiwi error:", e);
    } finally {
      setKiwiLoading(false);
    }
  };
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingDuration(0);
        const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-message-${Date.now()}.webm`, {
          type: "audio/webm"
        });
        const items = [
          { id: crypto.randomUUID(), file, status: "pending" }
        ];
        setUploads((prev) => [...prev, ...items]);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setTimeout(() => {
          if (mountedRef.current) handleSendRef.current();
        }, 100);
      };
      recorder.start();
      setRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1e3);
    } catch (e) {
      console.error("Failed to start recording:", e);
    }
  }, []);
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      recordingChunksRef.current = [];
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingDuration(0);
    setRecording(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const addFiles = (fileList) => {
    const items = Array.from(fileList).filter((f) => {
      const ext = getExtension(f.name);
      if (!isExtensionAllowed(ext)) {
        console.warn(`File type .${ext} not allowed: ${f.name}`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`);
        return false;
      }
      return true;
    }).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : void 0
    }));
    setUploads((prev) => [...prev, ...items]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      addFiles(imageFiles);
    }
  };
  const isLoading = uploading || sending || kiwiLoading;
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    if (!isDragging) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) {
      setIsDragging(false);
      dragCountRef.current = 0;
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDropOverlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCountRef.current = 0;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative border-t border-ios-separator-light bg-ios-bg-light dark:border-ios-separator-dark dark:bg-ios-grouped-dark",
      onDragEnter: handleDragEnter,
      children: [
        isDragging && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 z-20 flex items-center justify-center rounded-ios-lg border-2 border-dashed border-ios-blue-light bg-ios-blue-light/12 dark:border-ios-blue-dark dark:bg-ios-blue-dark/20",
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDropOverlay,
            role: "presentation",
            children: /* @__PURE__ */ jsx("p", { className: "rounded-ios bg-ios-blue-light px-5 py-2 text-[14px] font-medium text-white shadow-ios dark:bg-ios-blue-dark", children: "Drop files here to upload" })
          }
        ),
        replyTo && /* @__PURE__ */ jsx(ReplyPreview, { message: replyTo, onCancel: onCancelReply }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            multiple: true,
            className: "hidden",
            onChange: handleFileSelect
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: cameraInputRef,
            type: "file",
            accept: "image/*",
            capture: "environment",
            className: "hidden",
            onChange: handleFileSelect
          }
        ),
        uploads.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 px-3 pt-2", children: uploads.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-ios-separator-light dark:border-ios-separator-dark",
            children: [
              item.previewUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: item.previewUrl,
                  alt: item.file.name,
                  className: "h-full w-full object-cover"
                }
              ) : /* @__PURE__ */ jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center bg-ios-fill-light p-1.5 text-center dark:bg-ios-fill-dark", children: [
                /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4 text-ios-secondary_label-light dark:text-ios-secondary_label-dark" }),
                /* @__PURE__ */ jsx("span", { className: "mt-1 line-clamp-2 text-[9px] leading-tight text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: item.file.name })
              ] }),
              item.status === "uploading" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/40", children: /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin text-white" }) }),
              item.status === "error" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-ios-red-light/85", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-white", children: "Failed" }) }),
              item.status === "pending" && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                    setUploads((prev) => prev.filter((u) => u.id !== item.id));
                  },
                  className: "ios-press absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 active:bg-black/75",
                  "aria-label": "Remove attachment",
                  children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3 text-white", strokeWidth: 3 })
                }
              )
            ]
          },
          item.id
        )) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-end gap-1.5 px-2 py-1.5",
            onDragOver: (e) => e.preventDefault(),
            onDrop: handleDrop,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => fileInputRef.current?.click(),
                  className: "ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark",
                  title: "Attach file",
                  "aria-label": "Attach file",
                  children: /* @__PURE__ */ jsx(Paperclip, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleKiwiShare,
                  disabled: kiwiLoading,
                  className: "ios-press hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light disabled:opacity-40 dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark",
                  title: "Share via file.kiwi (E2E encrypted)",
                  "aria-label": "Share via file.kiwi",
                  children: kiwiLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-[18px] w-[18px] animate-spin" }) : /* @__PURE__ */ jsx(ExternalLink, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => cameraInputRef.current?.click(),
                  className: "ios-press hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark",
                  title: "Take photo",
                  "aria-label": "Take photo",
                  children: /* @__PURE__ */ jsx(Camera, { className: "h-[18px] w-[18px]", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                showEmojiPicker && /* @__PURE__ */ jsx(
                  EmojiPicker,
                  {
                    onSelect: (emoji) => {
                      setText((prev) => prev + emoji);
                      textareaRef.current?.focus();
                    },
                    onClose: () => setShowEmojiPicker(false)
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-end rounded-[20px] bg-ios-fill-light pl-3 pr-1.5 dark:bg-ios-secondary-dark", children: [
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      ref: textareaRef,
                      value: text,
                      onChange: handleChange,
                      onKeyDown: handleKeyDown,
                      onPaste: handlePaste,
                      placeholder: "iMessage",
                      rows: 1,
                      "aria-label": "Message text",
                      className: "block max-h-[140px] min-h-[36px] w-full flex-1 resize-none bg-transparent px-0 py-2 text-[15px] leading-snug text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark",
                      style: { height: "36px" }
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setShowEmojiPicker((prev) => !prev),
                      className: `ios-press mb-1 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full active:bg-black/10 dark:active:bg-white/15 ${showEmojiPicker ? "bg-ios-blue-light/20 text-ios-blue-light dark:bg-ios-blue-dark/30 dark:text-ios-blue-dark" : "text-ios-secondary_label-light dark:text-ios-secondary_label-dark"}`,
                      title: "Emoji",
                      "aria-label": "Toggle emoji picker",
                      children: /* @__PURE__ */ jsx(Smile, { className: "h-[16px] w-[16px]", strokeWidth: 2.2 })
                    }
                  )
                ] })
              ] }),
              recording ? /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[14px] font-medium tabular-nums text-ios-red-light dark:text-ios-red-dark", children: formatDuration(recordingDuration) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: cancelRecording,
                    className: "ios-press flex h-9 w-9 items-center justify-center rounded-full bg-ios-fill-light text-ios-label-light active:bg-ios-fill-light/70 dark:bg-ios-secondary-dark dark:text-white",
                    title: "Cancel recording",
                    "aria-label": "Cancel recording",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4", strokeWidth: 2.2 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: stopRecording,
                    className: "ios-press flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
                    title: "Send voice",
                    "aria-label": "Send voice message",
                    children: /* @__PURE__ */ jsx(ArrowUp, { className: "h-4 w-4", strokeWidth: 2.5 })
                  }
                )
              ] }) : text.trim() || uploads.length > 0 || isLoading ? /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleSend,
                  disabled: !text.trim() && uploads.length === 0 || isLoading,
                  className: "ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark",
                  title: "Send",
                  "aria-label": "Send message",
                  children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(ArrowUp, { className: "h-4 w-4", strokeWidth: 2.8 })
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onMouseDown: startRecording,
                  onMouseUp: stopRecording,
                  onMouseLeave: stopRecording,
                  onTouchStart: startRecording,
                  onTouchEnd: stopRecording,
                  className: "ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
                  title: "Hold to record",
                  "aria-label": "Hold to record voice message",
                  children: /* @__PURE__ */ jsx(Mic, { className: "h-4 w-4", strokeWidth: 2.5 })
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function MessageComposer(props) {
  if (!props.conversationId || !props.senderId) return null;
  return /* @__PURE__ */ jsx(
    MessageComposerInner,
    {
      ...props,
      conversationId: props.conversationId,
      senderId: props.senderId
    }
  );
}

function ForwardModal({ open, onClose, userId, onForward }) {
  const [conversations, setConversations] = useState([]);
  const [displayNames, setDisplayNames] = useState({});
  const [avatars, setAvatars] = useState({});
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data: memberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", userId);
      if (cancelled || !memberships?.length) return;
      const ids = memberships.map((m) => m.conversation_id);
      const { data: convs } = await supabase.from("conversations").select("*").in("id", ids).order("updated_at", { ascending: false });
      if (!convs || cancelled) return;
      setConversations(convs);
      const dmConvs = convs.filter((c) => c.type === "direct");
      if (dmConvs.length > 0) {
        const { data: dmMembers } = await supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", dmConvs.map((c) => c.id)).neq("user_id", userId);
        if (dmMembers) {
          const otherIds = [...new Set(dmMembers.map((m) => m.user_id))];
          const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds);
          if (profiles) {
            const nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
            const avatarMap = Object.fromEntries(profiles.map((p) => [p.id, p.avatar_url]));
            const names = {};
            const avs = {};
            for (const m of dmMembers) {
              names[m.conversation_id] = nameMap[m.user_id] || "User";
              avs[m.conversation_id] = avatarMap[m.user_id] || null;
            }
            if (!cancelled) {
              setDisplayNames(names);
              setAvatars(avs);
            }
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);
  if (!open) return null;
  const filtered = search ? conversations.filter((c) => {
    const name = c.name ?? displayNames[c.id] ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  }) : conversations;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-ios-fade",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      children: /* @__PURE__ */ jsxs("div", { className: "w-full max-h-[85dvh] overflow-hidden rounded-t-ios-xl bg-ios-bg-light shadow-ios-sheet dark:bg-ios-grouped-dark animate-ios-slide-up", children: [
        /* @__PURE__ */ jsx("div", { className: "ios-sheet-grabber", "aria-hidden": true }),
        /* @__PURE__ */ jsx("div", { className: "px-4 pb-1 pt-1 text-center", children: /* @__PURE__ */ jsx("h2", { className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: "Forward to…" }) }),
        /* @__PURE__ */ jsx("div", { className: "px-4 py-2", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Search,
            {
              className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
              strokeWidth: 2.5
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search",
              autoFocus: true,
              className: "h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark",
              "aria-label": "Search conversations"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto px-2 pb-2 scrollbar-thin", children: filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-[14px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: search ? "No conversations found" : "No conversations yet" }) : filtered.map((conv) => {
          const name = displayNames[conv.id] || conv.name || "Unnamed";
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                onForward(conv.id);
                onClose();
              },
              className: "ios-press flex w-full items-center gap-3 rounded-[10px] px-2 py-2 active:bg-ios-fill-light dark:active:bg-ios-fill-dark",
              children: [
                /* @__PURE__ */ jsx(Avatar, { name, size: "md", src: avatars[conv.id] }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-left", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark", children: name }),
                  /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: conv.type === "group" ? "Group" : "Direct Message" })
                ] })
              ]
            },
            conv.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { className: "ios-action-group ios-action-cancel-group", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "ios-action ios-action-cancel", children: /* @__PURE__ */ jsx("span", { children: "Cancel" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })
      ] })
    }
  );
}

const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#88ff00"];
const PARTICLE_COUNT = 60;
function ConfettiEffect({ active }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 3,
      life: 0,
      maxLife: 60 + Math.random() * 40,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      let alive = false;
      for (const p of particles) {
        if (p.life >= p.maxLife) continue;
        alive = true;
        p.life++;
        p.x += p.vx;
        p.vy += 0.3;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);
  if (!active) return null;
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      className: "pointer-events-none fixed inset-0 z-[60]",
      "aria-hidden": "true"
    }
  );
}

function ChatWindow({
  conversationId,
  user,
  isAdmin,
  onGroupSettings,
  onBack
}) {
  const {
    messages,
    loading,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    sendWithAttachments,
    forwardMessage
  } = useMessages(conversationId, user.id);
  const { typingUserIds, setTyping } = useTypingIndicator(conversationId, user.id);
  const { onlineUserIds } = usePresence(conversationId, user.id);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [typingNames, setTypingNames] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  useEffect(() => {
    if (!conversationId) return;
    supabase.from("conversations").select("type").eq("id", conversationId).single().then(({ data }) => setIsGroup(data?.type === "group"));
  }, [conversationId]);
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId, user.id).then(() => window.dispatchEvent(new CustomEvent("mark-read", { detail: conversationId }))).catch((e) => console.error("Failed to mark as read:", e));
    }
  }, [conversationId, user.id]);
  useEffect(() => {
    if (typingUserIds.length === 0) return;
    let cancelled = false;
    supabase.from("profiles").select("id, full_name").in("id", typingUserIds).then(({ data }) => {
      if (cancelled || !data) return;
      const map = new Map(data.map((p) => [p.id, p.full_name]));
      setTypingNames(
        typingUserIds.map((id) => map.get(id) ?? "Someone").filter(Boolean)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [typingUserIds]);
  const handleRetry = useCallback(
    (msg) => {
      const content = msg.content ?? "";
      if (content) sendMessage(content, msg.reply_to_id ?? null, msg.forwarded_from_id ?? null);
    },
    [sendMessage]
  );
  const handleSendMessage = useCallback(
    (content, replyToId) => {
      sendMessage(content, replyToId ?? null);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    },
    [sendMessage]
  );
  const handleSendWithAttachments = useCallback(
    (content, attachments, replyToId) => {
      sendWithAttachments(content, attachments, replyToId ?? null);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    },
    [sendWithAttachments]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ConfettiEffect, { active: showConfetti }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col overflow-hidden bg-ios-bg-light dark:bg-ios-grouped-dark", children: [
      /* @__PURE__ */ jsx(
        ChatHeader,
        {
          conversationId,
          currentUserId: user.id,
          onlineUserIds,
          isAdmin,
          onGroupSettings,
          onBack,
          typingNames
        }
      ),
      /* @__PURE__ */ jsx(
        MessageList,
        {
          messages,
          loading,
          hasMore,
          currentUserId: user.id,
          conversationId,
          isGroup,
          onLoadMore: loadMore,
          onReply: setReplyTo,
          onForward: setForwardMsg,
          onRetry: handleRetry
        }
      ),
      /* @__PURE__ */ jsx(
        MessageComposer,
        {
          conversationId,
          senderId: user.id,
          sending,
          replyTo,
          onCancelReply: () => setReplyTo(null),
          onSendMessage: (content, replyToId) => {
            handleSendMessage(content, replyToId);
            setReplyTo(null);
          },
          onSendWithAttachments: (content, attachments, replyToId) => {
            handleSendWithAttachments(content, attachments, replyToId);
            setReplyTo(null);
          },
          onTyping: setTyping
        }
      ),
      forwardMsg && /* @__PURE__ */ jsx(
        ForwardModal,
        {
          open: !!forwardMsg,
          onClose: () => setForwardMsg(null),
          userId: user.id,
          onForward: (targetConvId) => {
            const content = forwardMsg.content ?? "";
            if (content) forwardMessage(targetConvId, content, forwardMsg.id);
            setForwardMsg(null);
          }
        }
      )
    ] })
  ] });
}

function EmptyState({ onStartChat }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-1 flex-col items-center justify-center bg-ios-grouped-light px-6 text-center dark:bg-ios-grouped-dark", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-ios-blue-light/20 to-ios-blue-light/5 dark:from-ios-blue-dark/30 dark:to-ios-blue-dark/10", children: /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ios-blue-light to-ios-blue-light/70 shadow-ios dark:from-ios-blue-dark dark:to-ios-blue-dark/70", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-8 w-8 text-white", strokeWidth: 2 }) }) }),
    /* @__PURE__ */ jsx("h2", { className: "text-[22px] font-semibold tracking-tight text-ios-label-light dark:text-ios-label-dark", children: "Welcome to Apex Chat" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-[280px] text-[15px] leading-snug text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Select a conversation from the list, or start a new one to begin messaging your team." }),
    onStartChat && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onStartChat,
        className: "ios-press mt-6 inline-flex h-10 items-center gap-2 rounded-ios bg-ios-blue-light px-5 text-[15px] font-medium text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
        children: [
          /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4", strokeWidth: 2.5 }),
          "New Message"
        ]
      }
    )
  ] });
}

const sizeMap = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };
function Spinner({ size = "md", className = "", variant = "ios" }) {
  if (variant === "ios") {
    return /* @__PURE__ */ jsx(
      "span",
      {
        className: `inline-block ${sizeMap[size]} ${className}`,
        role: "status",
        "aria-label": "Loading",
        children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 100 100", className: "h-full w-full animate-spin", style: { animationDuration: "0.9s" }, children: /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "42", fill: "none", stroke: "currentColor", strokeWidth: "10", strokeLinecap: "round", strokeDasharray: "60 200" }) })
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: `inline-block ${sizeMap[size]} animate-spin rounded-full border-current border-t-transparent text-ios-blue-light dark:text-ios-blue-dark ${className}`,
      role: "status",
      "aria-label": "Loading"
    }
  );
}

function AdminPanel({ open, onClose }) {
  const { profiles, loading, search } = useProfiles();
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState(null);
  const handleSearch = (val) => {
    setQuery(val);
    search(val);
  };
  const toggleRole = async (id, currentRole) => {
    setUpdating(id);
    try {
      await updateProfile(id, { role: currentRole === "admin" ? "employee" : "admin" });
      search(query);
    } catch (e) {
      console.error("Failed to toggle role:", e);
    }
    setUpdating(null);
  };
  const toggleActive = async (id, isActive) => {
    setUpdating(id);
    try {
      await updateProfile(id, { is_active: !isActive });
      search(query);
    } catch (e) {
      console.error("Failed to toggle active status:", e);
    }
    setUpdating(null);
  };
  return /* @__PURE__ */ jsxs(Modal, { open, onClose, title: "Admin", hideClose: true, variant: "centered", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative mb-3", children: [
        /* @__PURE__ */ jsx(
          Search,
          {
            className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: query,
            onChange: (e) => handleSearch(e.target.value),
            placeholder: "Search employees",
            "aria-label": "Search users",
            className: "h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsx(Spinner, { size: "md" }) }) : /* @__PURE__ */ jsx("div", { className: "max-h-[60vh] overflow-y-auto rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark", children: profiles.map((p, idx) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex items-center gap-3 px-3 py-2.5 ${idx !== profiles.length - 1 ? "border-b border-ios-separator-light dark:border-ios-separator-dark" : ""}`,
          children: [
            /* @__PURE__ */ jsx(Avatar, { name: p.full_name, size: "md", src: p.avatar_url }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "truncate text-[15px] font-medium text-ios-label-light dark:text-ios-label-dark", children: p.full_name }),
              /* @__PURE__ */ jsx("p", { className: "text-[12px] capitalize text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: p.role })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-0.5", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => toggleRole(p.id, p.role),
                  disabled: updating === p.id,
                  className: `ios-press flex h-8 w-8 items-center justify-center rounded-full active:bg-ios-orange-light/15 ${p.role === "admin" ? "text-ios-orange-light dark:text-ios-orange-dark" : "text-ios-secondary_label-light dark:text-ios-secondary_label-dark"}`,
                  title: p.role === "admin" ? "Demote to employee" : "Promote to admin",
                  "aria-label": "Toggle role",
                  children: p.role === "admin" ? /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4", strokeWidth: 2.2 }) : /* @__PURE__ */ jsx(ShieldOff, { className: "h-4 w-4", strokeWidth: 2.2 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => toggleActive(p.id, p.is_active),
                  disabled: updating === p.id,
                  className: `ios-press flex h-8 w-8 items-center justify-center rounded-full active:bg-ios-fill-light/70 dark:active:bg-ios-fill-dark/70 ${p.is_active ? "text-ios-green-light dark:text-ios-green-dark" : "text-ios-red-light dark:text-ios-red-dark"}`,
                  title: p.is_active ? "Deactivate" : "Activate",
                  "aria-label": "Toggle active status",
                  children: updating === p.id ? /* @__PURE__ */ jsx(Spinner, { size: "sm" }) : p.is_active ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4", strokeWidth: 2.2 }) : /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4", strokeWidth: 2.2 })
                }
              )
            ] })
          ]
        },
        p.id
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ios-action-group ios-action-cancel-group", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "ios-action ios-action-cancel", children: /* @__PURE__ */ jsx("span", { children: "Done" }) }) })
  ] });
}

function GroupSettingsModal({
  open,
  onClose,
  conversationId,
  currentName,
  userId,
  onRename
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState("member");
  const [search, setSearch] = useState("");
  const { profiles, search: searchProfiles } = useProfiles(userId);
  const initializedRef = useRef(false);
  const isAdmin = userRole === "admin";
  const memberIds = members.map((m) => m.user_id);
  useEffect(() => {
    if (open && !initializedRef.current) {
      setName(currentName);
      initializedRef.current = true;
    }
    if (!open) {
      initializedRef.current = false;
    }
  }, [open, currentName]);
  useEffect(() => {
    let cancelled = false;
    const loadMembers = async () => {
      if (!open || !conversationId) {
        setMembers([]);
        return;
      }
      try {
        const rows = await getConversationMembers(conversationId);
        if (cancelled) return;
        setMembers(
          rows.map((m) => ({ ...m.profiles, user_id: m.user_id, role: m.role }))
        );
        const current = rows.find((m) => m.user_id === userId);
        if (current) setUserRole(current.role);
      } catch (error) {
        console.error("Failed to load members:", error);
        if (!cancelled) setMembers([]);
      }
    };
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, userId]);
  const handleRename = async () => {
    if (!name.trim() || name === currentName) return;
    setSaving(true);
    try {
      await renameGroup(conversationId, name.trim());
      onRename?.(name.trim());
    } catch (e) {
      console.error("Failed to rename group:", e);
      setName(currentName);
    }
    setSaving(false);
  };
  const handleAddMember = async (profileId) => {
    try {
      await addMember(conversationId, profileId);
      const added = profiles.find((p) => p.id === profileId);
      if (added) setMembers((prev) => [...prev, { ...added, user_id: added.id }]);
    } catch (err) {
      console.error(err);
    }
  };
  const handleRemoveMember = async (profileId) => {
    try {
      await removeMember(conversationId, profileId);
      setMembers((prev) => prev.filter((m) => m.user_id !== profileId));
    } catch (err) {
      console.error(err);
    }
  };
  const handleSearch = (val) => {
    setSearch(val);
    searchProfiles(val);
  };
  return /* @__PURE__ */ jsxs(Modal, { open, onClose, title: "Group Info", hideClose: true, children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "Group name" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: name,
              onChange: (e) => setName(e.target.value),
              disabled: !isAdmin,
              className: "h-10 flex-1 rounded-[10px] bg-ios-fill-light px-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 disabled:opacity-50 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleRename,
              disabled: !name.trim() || name === currentName || saving || !isAdmin,
              className: "ios-press flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ios-blue-light text-white active:bg-ios-blue-light/85 disabled:opacity-40 dark:bg-ios-blue-dark",
              "aria-label": "Rename group",
              children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4", strokeWidth: 2.5 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 flex items-center justify-between", children: /* @__PURE__ */ jsxs("label", { className: "text-[12px] font-medium uppercase tracking-wide text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: [
          "Members (",
          members.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Search,
            {
              className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark",
              strokeWidth: 2.5
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => handleSearch(e.target.value),
              placeholder: "Add people",
              "aria-label": "Add members",
              className: "h-9 w-full rounded-[10px] bg-ios-fill-light pl-8 pr-3 text-[15px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/40 dark:bg-ios-secondary-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark", children: members.map((p) => {
        const isMemberAdmin = p.role === "admin";
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-3 border-b border-ios-separator-light px-3 py-2 last:border-b-0 dark:border-ios-separator-dark",
            children: [
              /* @__PURE__ */ jsx(Avatar, { name: p.full_name, size: "sm", src: p.avatar_url }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxs("p", { className: "truncate text-[14px] font-medium text-ios-label-light dark:text-ios-label-dark", children: [
                  p.full_name,
                  p.user_id === userId && /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-[11px] font-normal text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "(you)" })
                ] }),
                isMemberAdmin && /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium text-ios-orange-light dark:text-ios-orange-dark", children: "Admin" })
              ] }),
              isAdmin && p.user_id !== userId && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateMemberRole(
                      conversationId,
                      p.user_id,
                      isMemberAdmin ? "member" : "admin"
                    ).then(
                      () => setMembers(
                        (prev) => prev.map(
                          (m) => m.user_id === p.user_id ? { ...m, role: isMemberAdmin ? "member" : "admin" } : m
                        )
                      )
                    ),
                    className: "ios-press flex h-7 w-7 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-orange-light/15 dark:text-ios-secondary_label-dark",
                    "aria-label": isMemberAdmin ? "Remove admin" : "Make admin",
                    title: isMemberAdmin ? "Remove admin" : "Make admin",
                    children: isMemberAdmin ? /* @__PURE__ */ jsx(ShieldOff, { className: "h-3.5 w-3.5", strokeWidth: 2.2 }) : /* @__PURE__ */ jsx(Shield, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleRemoveMember(p.user_id),
                    className: "ios-press flex h-7 w-7 items-center justify-center rounded-full text-ios-red-light active:bg-ios-red-light/15 dark:text-ios-red-dark",
                    "aria-label": "Remove member",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5", strokeWidth: 2.2 })
                  }
                )
              ] })
            ]
          },
          p.user_id
        );
      }) }),
      search.trim() && /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-[12px] bg-ios-fill-light dark:bg-ios-secondary-dark", children: [
        profiles.filter((p) => !memberIds.includes(p.id) && p.id !== userId).map((p) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleAddMember(p.id),
            className: "ios-press flex w-full items-center gap-3 border-b border-ios-separator-light px-3 py-2 text-left last:border-b-0 active:bg-ios-fill-light/70 dark:border-ios-separator-dark dark:active:bg-ios-secondary-dark/70",
            children: [
              /* @__PURE__ */ jsx(Avatar, { name: p.full_name, size: "sm", src: p.avatar_url }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "truncate text-[14px] font-medium text-ios-label-light dark:text-ios-label-dark", children: p.full_name }),
                /* @__PURE__ */ jsx("p", { className: "truncate text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: p.email })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "rounded-md bg-ios-blue-light/15 px-2 py-0.5 text-[10px] font-semibold text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark", children: "ADD" })
            ]
          },
          p.id
        )),
        profiles.filter((p) => !memberIds.includes(p.id) && p.id !== userId).length === 0 && /* @__PURE__ */ jsx("p", { className: "px-3 py-4 text-center text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: "No matching people" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ios-action-group ios-action-cancel-group", children: /* @__PURE__ */ jsx("button", { onClick: onClose, className: "ios-action ios-action-cancel", children: /* @__PURE__ */ jsx("span", { children: "Done" }) }) }),
    /* @__PURE__ */ jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })
  ] });
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: void 0 });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-1 flex-col items-center justify-center gap-3 bg-ios-grouped-light p-8 text-center dark:bg-ios-grouped-dark", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-full bg-ios-red-light/15 dark:bg-ios-red-dark/25", children: /* @__PURE__ */ jsx(
          AlertTriangle,
          {
            className: "h-7 w-7 text-ios-red-light dark:text-ios-red-dark",
            strokeWidth: 2.2
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark", children: "Something went wrong" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark", children: this.state.error?.message || "An unexpected error occurred" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: this.handleRetry,
            className: "ios-press mt-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ios-blue-light px-4 text-[14px] font-medium text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-3.5 w-3.5", strokeWidth: 2.5 }),
              "Try again"
            ]
          }
        )
      ] });
    }
    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversationName, setActiveConversationName] = useState("");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const prevConvIdRef = useRef(null);
  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }
      setUser(u);
      try {
        const p = await getProfile(u.id);
        setProfile(p);
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    const sub = onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    });
    return () => sub.data?.subscription?.unsubscribe();
  }, []);
  useEffect(() => {
    if (prevConvIdRef.current === activeConversationId) return;
    prevConvIdRef.current = activeConversationId;
    if (!activeConversationId) return;
    supabase.from("conversations").select("name").eq("id", activeConversationId).single().then(({ data }) => setActiveConversationName(data?.name ?? ""));
  }, [activeConversationId]);
  const { requestPermission } = useNotifications({
    userId: user?.id ?? "",
    activeConversationId,
    autoRequest: false
  });
  const onNotificationClick = useCallback((e) => {
    const convId = e.detail;
    if (convId) setActiveConversationId(convId);
  }, []);
  useEffect(() => {
    window.addEventListener("notification-click", onNotificationClick);
    return () => window.removeEventListener("notification-click", onNotificationClick);
  }, [onNotificationClick]);
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    updateLastSeen(uid);
    const interval = setInterval(() => updateLastSeen(uid), 6e4);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") updateLastSeen(uid);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id]);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") setActiveConversationId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-dvh items-center justify-center bg-ios-grouped-light dark:bg-black", children: /* @__PURE__ */ jsx(Spinner, { size: "lg" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative flex h-dvh flex-col overflow-hidden bg-ios-grouped-light dark:bg-black", children: [
    !online && /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center justify-center gap-2 bg-ios-red-light px-4 py-1.5 text-[12px] font-medium text-white dark:bg-ios-red-dark", children: [
      /* @__PURE__ */ jsx(WifiOff, { className: "h-3.5 w-3.5" }),
      "No internet connection"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `${activeConversationId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col overflow-hidden border-r border-ios-separator-light bg-ios-grouped-light md:w-[340px] md:flex dark:border-ios-separator-dark dark:bg-ios-grouped-dark`,
          children: /* @__PURE__ */ jsx(
            Sidebar,
            {
              user,
              activeConversationId,
              onSelectConversation: setActiveConversationId,
              onAdminPanel: () => setAdminPanelOpen(true),
              onEnableNotifications: requestPermission
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `${activeConversationId ? "flex" : "hidden md:flex"} w-full flex-1 flex-col overflow-hidden bg-ios-bg-light chat-area dark:bg-ios-grouped-dark`,
          children: activeConversationId && user ? /* @__PURE__ */ jsx("div", { className: "flex h-full flex-1 animate-ios-fade", children: /* @__PURE__ */ jsx(
            ChatWindow,
            {
              conversationId: activeConversationId,
              user,
              isAdmin: profile?.role === "admin",
              onGroupSettings: () => setGroupSettingsOpen(true),
              onBack: () => setActiveConversationId(null)
            }
          ) }) : /* @__PURE__ */ jsx("div", { className: "flex h-full flex-1 animate-ios-fade", children: /* @__PURE__ */ jsx(EmptyState, {}) })
        }
      ) }),
      /* @__PURE__ */ jsx(AdminPanel, { open: adminPanelOpen, onClose: () => setAdminPanelOpen(false) }),
      /* @__PURE__ */ jsx(
        GroupSettingsModal,
        {
          open: groupSettingsOpen,
          onClose: () => setGroupSettingsOpen(false),
          conversationId: activeConversationId ?? "",
          currentName: activeConversationName,
          userId: user?.id ?? "",
          onRename: (newName) => setActiveConversationName(newName)
        }
      )
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "App", App, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/workspace/src/components/App", "client:component-export": "default" })} ` })}`;
}, "/workspace/src/pages/chat/index.astro", void 0);

const $$file = "/workspace/src/pages/chat/index.astro";
const $$url = "/chat";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
