import { UserPlus, PlusCircle, Pencil, UserX, Ban } from "lucide-react";

export const HISTORY_TYPE_CONFIG = {
  add_admin: {
    icon: UserPlus,
    badgeKey: "badges.addAdmin",
    variant: "cyan",
  },
  add_item: {
    icon: PlusCircle,
    badgeKey: "badges.addItem",
    variant: "primary",
  },
  edit_item: {
    icon: Pencil,
    badgeKey: "badges.editItem",
    variant: "muted",
  },
  deactivate_admin: {
    icon: UserX,
    badgeKey: "badges.deactivateAdmin",
    variant: "danger",
  },
  deactivate_item: {
    icon: Ban,
    badgeKey: "badges.deactivateItem",
    variant: "danger",
  },
};

export function getHistoryConfig(type) {
  return (
    HISTORY_TYPE_CONFIG[type] || {
      icon: Pencil,
      badgeKey: "badges.unknown",
      variant: "muted",
    }
  );
}

export function groupHistoryByDate(items, locale = "id") {
  const groups = [];
  const map = new Map();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  items.forEach((item) => {
    const date = new Date(item.created_at);
    const startOfItemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday - startOfItemDay) / 86400000);

    let label;
    if (diffDays <= 0) {
      label = locale === "id" ? "Sekarang" : "Now";
    } else if (diffDays === 1) {
      label = locale === "id" ? "Kemarin" : "Yesterday";
    } else {
      label = locale === "id" ? `${diffDays} hari lalu` : `${diffDays} days ago`;
    }

    const key = startOfItemDay.toISOString();
    if (!map.has(key)) {
      const group = {
        key,
        label,
        dateDisplay: startOfItemDay.toLocaleDateString(
          locale === "id" ? "id-ID" : "en-US",
          { day: "2-digit", month: "long", year: "numeric" },
        ),
        items: [],
      };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  });

  return groups;
}