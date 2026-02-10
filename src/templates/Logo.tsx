export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xl font-bold tracking-tighter text-foreground">
    <svg
      className="size-8 stroke-primary stroke-2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0 0h24v24H0z" stroke="none" />
      <rect x="3" y="12" width="6" height="8" rx="1.5" />
      <rect x="9" y="8" width="6" height="12" rx="1.5" />
      <rect x="15" y="4" width="6" height="16" rx="1.5" />
      <path d="M4 20h16" />
    </svg>
    {!props.isTextHidden && (
      <span>
        Cremonini
        <span className="text-primary">.pro</span>
      </span>
    )}
  </div>
);
