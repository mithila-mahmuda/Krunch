/** Same chip as the POS header assigned-branch label. */
export function AssignedBranchBadge({ name }: { name: string }) {
  return (
    <span
      className="app-header-btn app-header-btn--label max-w-[8rem] tracking-wide sm:max-w-none"
      title="Branch is assigned by an admin"
    >
      <span className="truncate">{name}</span>
    </span>
  );
}
