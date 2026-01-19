export const calculateTimeLeft = (endTime: Date) => {
  const currentTime = new Date().getTime();
  const difference = endTime.getTime() - currentTime;
  const secondsSinceEpoch = difference / 1000;

  if (difference <= 0) {
    return [0, 0, 0, 0];
  }

  const days = Math.floor(secondsSinceEpoch / (60 * 60 * 24));
  const hours = Math.floor((secondsSinceEpoch / 3600) % 24);
  const minutes = Math.floor((secondsSinceEpoch / 60) % 60);
  const seconds = Math.floor(secondsSinceEpoch % 60);

  return [days, hours, minutes, seconds];
};

export const formatDate = (
  isoDate: string,
  format: "MM/DD/YY" | "DD/MM/YY" = "DD/MM/YY"
) => {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  if (format === "MM/DD/YY") {
    return `${month}/${day}/${year}`;
  }

  return `${day}/${month}/${year}`;
};
