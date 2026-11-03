// Formats a number as Bhutanese Ngultrum, e.g. 1234.5 -> "Nu. 1,234.50".
// Done by hand (no Intl) so it behaves the same on every phone.
export function formatNu(amount) {
  const value = Number(amount) || 0;
  const sign = value < 0 ? '-' : '';
  const [whole, decimals] = Math.abs(value).toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}Nu. ${withCommas}.${decimals}`;
}