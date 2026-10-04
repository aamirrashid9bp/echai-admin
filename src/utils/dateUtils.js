// Date range filter helpers

export const getDateRange = (filterType, customStart = null, customEnd = null) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  switch (filterType) {
    case 'today': {
      return { start: todayStr, end: todayStr };
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      return { start: yestStr, end: yestStr };
    }
    case 'this_week': {
      const firstDay = new Date(now);
      const day = firstDay.getDay();
      const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1); // Monday
      firstDay.setDate(diff);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: todayStr,
      };
    }
    case 'last_week': {
      const firstDay = new Date(now);
      const day = firstDay.getDay();
      const diff = firstDay.getDate() - day - 6; // Last Monday
      firstDay.setDate(diff);
      const lastDay = new Date(firstDay);
      lastDay.setDate(lastDay.getDate() + 6);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
      };
    }
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: todayStr,
      };
    }
    case 'last_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
      };
    }
    case 'custom': {
      return {
        start: customStart || todayStr,
        end: customEnd || todayStr,
      };
    }
    case 'all':
    default:
      return { start: null, end: null };
  }
};

export const isWithinDateRange = (itemDate, range) => {
  if (!itemDate || (!range.start && !range.end)) return true;
  const target = itemDate.substring(0, 10);
  if (range.start && target < range.start) return false;
  if (range.end && target > range.end) return false;
  return true;
};
