const timeAgoString = (timestampMsec?: number) => {
  if (timestampMsec === undefined) return "";
  const timestampSeconds = Math.floor(timestampMsec / 1000);
  const now = Date.now();
  const diff = now - timestampSeconds * 1000;
  const diffSeconds = Math.floor(diff / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffWeeks / 4);
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears > 0) {
    return `${diffYears} yr${diffYears === 1 ? "" : "s"} ago`;
  } else if (diffWeeks > 0) {
    return `${diffWeeks} wk${diffWeeks === 1 ? "" : "s"} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} min ago`;
  } else {
    return `${diffSeconds} sec ago`;
  }
};

export default timeAgoString;
