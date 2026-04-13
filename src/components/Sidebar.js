"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import Icon from "@/components/Icon";

const NAV_ITEMS = [
  { id: "dashboard", icon: "dashboard", label: "Tableau de bord" },
  { id: "clients", icon: "users", label: "Mes entreprises" },
  { id: "wheel", icon: "wheel", label: "Ma Roue" },
  { id: "codes", icon: "check", label: "Validations" },
  { id: "affiliation", icon: "link", label: "Affiliation" },
  { id: "subscription", icon: "creditCard", label: "Abonnement" },
  { id: "account", icon: "user", label: "Mon compte" },
];

export default function Sidebar({ user }) {
  const router = useRouter();
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed } = useApp();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const planColors = {
    pro: { bg: "#6C5CE7", label: "Pro" },
    starter: { bg: "#00B894", label: "Starter" },
    free: { bg: "#636e72", label: "Gratuit" },
  };
  const plan = planColors[user?.plan] || planColors.free;

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
      style={{ width: sidebarCollapsed ? 72 : 260, background: "#0F0F1A" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div
          className="rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #6C5CE7, #00B894)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, fontFamily: "'Calistoga', serif" }}>z</span>
        </div>
        {!sidebarCollapsed && (
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 19, fontFamily: "'Calistoga', serif", letterSpacing: "-0.3px" }}>
            zReview
          </span>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="ml-auto text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-full flex justify-center text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        )}
      </div>

      {/* User badge */}
      {!sidebarCollapsed && user && (
        <div style={{
          margin: "0 12px 12px",
          background: "rgba(255,255,255,0.04)", borderRadius: 12,
          padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #6C5CE7, #00B894)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "#fff", fontSize: 14, flexShrink: 0,
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: plan.bg,
              textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              {plan.label}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-[2px] overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`sidebar-item ${active ? "sidebar-item-active" : "sidebar-item-inactive"}`}
              title={sidebarCollapsed ? item.label : ""}
            >
              <Icon name={item.icon} size={20} color={active ? "#a29bfe" : "#6b7280"} />
              {!sidebarCollapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-6 flex flex-col gap-2">
        <button
          onClick={() => setCurrentPage("subscription")}
          className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-white font-bold text-[13px] w-full hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #6C5CE7, #00B894)" }}
        >
          <Icon name="zap" size={18} color="#fff" />
          {!sidebarCollapsed && "Upgrade Pro"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-[11px] rounded-[10px] text-gray-500 font-medium text-[13px] w-full hover:bg-white/[0.04] transition-colors"
        >
          <Icon name="logout" size={18} />
          {!sidebarCollapsed && "Déconnexion"}
        </button>
      </div>
    </aside>
  );
}
