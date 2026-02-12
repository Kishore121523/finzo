export function FinzoLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="fzlg"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#03DAC6" />
          <stop offset="1" stopColor="#029E8E" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#fzlg)" />
      <path
        d="M12 31V9H29V14H17.5V18H24L27.5 20.5L24 23H17.5V31H12Z"
        fill="white"
      />
    </svg>
  );
}
