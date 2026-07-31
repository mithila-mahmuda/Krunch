const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatTillClock(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleString("en-GB", { month: "short" })
    .toUpperCase();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${hours}:${minutes}`;
}
