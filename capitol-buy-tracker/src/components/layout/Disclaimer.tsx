export const DISCLAIMER =
  "Transaction sizes are reported as ranges. Estimated volume uses the midpoint of each disclosed range and does not represent the exact transaction amount. Purchase disclosures may be published after the transaction date. Current market prices may be delayed depending on the selected data provider. This dashboard is for research purposes and is not financial advice.";

export function Disclaimer() {
  return (
    <div className="rounded-md border border-line bg-panel px-4 py-3 text-[11px] leading-relaxed text-muted">
      <span className="mr-1 font-semibold text-ink">Disclaimer.</span>
      {DISCLAIMER}
    </div>
  );
}
