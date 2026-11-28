import type { SVGProps } from "react";

export function ArrowRightIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18.854 12.354a.5.5 0 0 0 0-.708l-5.5-5.5a.5.5 0 0 0-.708.708L17.793 12l-5.147 5.146a.5.5 0 0 0 .708.708l5.5-5.5Z"
        clipRule="evenodd"
      />
      <path fillRule="evenodd" d="M19 12a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1 0-1h13a.5.5 0 0 1 .5.5Z" clipRule="evenodd" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.146 12.354a.5.5 0 0 1 0-.708l5.5-5.5a.5.5 0 0 1 .708.708L6.207 12l5.147 5.146a.5.5 0 0 1-.708.708l-5.5-5.5Z"
        clipRule="evenodd"
      />
      <path fillRule="evenodd" d="M5 12a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1h-13a.5.5 0 0 0-.5.5Z" clipRule="evenodd" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 47 24" fill="none" className={className} aria-hidden="true">
      <path d="M1 1L23.5 23L46 1" stroke="currentColor" vectorEffect="non-scaling-stroke" strokeWidth="1.5" />
    </svg>
  );
}

export function PlusIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function QuoteMarkIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M44.096 55.296V91H11V62.812c0-15.26 1.83-26.308 5.488-33.141C21.288 20.56 28.892 13.669 39.294 9l7.545 11.958c-6.288 2.62-10.918 6.549-13.89 11.788-2.973 5.125-4.63 12.642-4.973 22.55h16.12Zm43.16 0V91H54.16V62.812c0-15.26 1.83-26.308 5.487-33.141C64.45 20.56 72.051 13.669 82.455 9L90 20.958c-6.288 2.62-10.918 6.549-13.89 11.788-2.973 5.125-4.63 12.642-4.973 22.55h16.12Z"
      />
    </svg>
  );
}

export function WorkflowStepIcon({
  id,
  className,
}: {
  id: "verify" | "discover" | "sweep" | "prove";
  className?: string;
}) {
  if (id === "verify") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.448 16.924a.5.5 0 0 0 0 1v-1Zm21.264.5h.5a.5.5 0 0 0-.5-.5v.5Zm0 24.288v.5a.5.5 0 0 0 .5-.5h-.5Zm-24.288 0h-.5a.5.5 0 0 0 .5.5v-.5Zm.5-21.264a.5.5 0 1 0-1 0h1ZM5.28 5.28v-.5a.5.5 0 0 0-.5.5h.5Zm24.288 0h.5a.5.5 0 0 0-.5-.5v.5Zm0 24.288v.5a.5.5 0 0 0 .5-.5h-.5Zm-24.288 0h-.5a.5.5 0 0 0 .5.5v-.5Zm36.94-12.144c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm.508 24.796c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm-23.78.508c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm3.024-23.28h21.264v-1H20.448v1Zm20.764-.5v24.288h1V17.424h-1Zm.5 23.788H17.424v1h24.288v-1Zm-23.788.5V20.448h-1v21.264h1ZM5.28 5.78h24.288v-1H5.28v1Zm23.788-.5v24.288h1V5.28h-1Zm.5 23.788H5.28v1h24.288v-1Zm-23.788.5V5.28h-1v24.288h1Z"
        />
        <path fill="#02acc5" stroke="#02acc5" strokeLinecap="round" strokeLinejoin="round" d="M17.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    );
  }
  if (id === "discover") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M38.256 7.22a.5.5 0 0 0 0-1v1Zm-9.154-.5v-.5a.5.5 0 0 0-.5.5h.5Zm11.564 12.649a.5.5 0 0 0 0-1v1ZM16.42 42.792a.5.5 0 1 0 1 0h-1Zm12.182-.077a.5.5 0 1 0 1 0h-1ZM16.92 18.87v-.5a.5.5 0 0 0-.5.5h.5ZM4.704 31.05v-.5a.5.5 0 0 0-.5.506l.5-.006Zm.144 12.101-.5.006a.5.5 0 0 0 .5.494v-.5Zm36.432 0v.5a.5.5 0 0 0 .5-.5h-.5Zm.5-33.408a.5.5 0 0 0-1 0h1Zm-.457 21.807a.5.5 0 0 0 0-1v1ZM29.61 18.864c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.228-.508.508-.508v-1c-.832 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1ZM5.356 43.152c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm12.58-11.593c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.228.508.508h1c0-.833-.675-1.508-1.508-1.508v1ZM38.256 6.22h-9.154v1h9.154v-1Zm-9.654.5v12.149h1V6.72h-1Zm.5 12.649h11.564v-1H29.102v1ZM16.42 31.05v11.741h1v-11.74h-1Zm13.182 11.664V18.87h-1v23.846h1Zm-.5-24.346H16.92v1h12.182v-1Zm-12.682.5V31.05h1V18.87h-1Zm.5 11.682H4.704v1H16.92v-1Zm-12.716.506.144 12.1 1-.011-.144-12.1-1 .011Zm.644 12.595H41.28v-1H4.848v1Zm36.932-.5V9.744h-1v33.408h1Zm-24.86-11.6h24.403v-1H16.92v1Z"
        />
        <path fill="#02acc5" stroke="#02acc5" strokeLinecap="round" strokeLinejoin="round" d="M41.5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    );
  }
  if (id === "sweep") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M29.423 26.87a.5.5 0 1 0 1 0h-1Zm.5-12.998v-.5a.5.5 0 0 0-.5.5h.5Zm3.869.5a.5.5 0 1 0 0-1v1Zm-19.464 6.83v.5a.5.5 0 0 0 .5-.5h-.5Zm-13.776 0h-.5a.5.5 0 0 0 .5.5v-.5Zm0-13.81v-.5a.5.5 0 0 0-.5.5h.5Zm13.776 0h.5a.5.5 0 0 0-.5-.5v.5Zm22.493 33.49v.5a.5.5 0 0 0 .5-.5h-.5Zm-13.815 0h-.5a.5.5 0 0 0 .5.5v-.5Zm0-13.805v-.5a.5.5 0 0 0-.5.5h.5Zm13.815 0h.5a.5.5 0 0 0-.5-.5v.5ZM22.8 34.628a.5.5 0 0 0 0-1v1Zm-15.226-.5h-.5a.5.5 0 0 0 .5.5v-.5Zm.5-12.864a.5.5 0 0 0-1 0h1Zm33.17-14.5a.5.5 0 1 0-.706.708l.707-.707Zm6.204 6.906.353.354a.5.5 0 0 0 0-.707l-.353.353Zm-6.91 6.194a.5.5 0 0 0 .707.707l-.707-.707ZM23.596 34.128c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.227-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm7.343-6.543c0 .28-.227.508-.508.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.508.508a.508.508 0 0 1-.508-.508h-1c0 .833.675 1.508 1.508 1.508v-1Zm-.508-.508c0-.28.228-.508.508-.508v-1c-.833 0-1.508.675-1.508 1.508h1Zm.508-.508c.28 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm-21.84-5.367c0 .28-.228.508-.509.508v1c.833 0 1.508-.675 1.508-1.508h-1Zm-.509.508a.508.508 0 0 1-.508-.508h-1a1.51 1.51 0 0 0 1.508 1.508v-1Zm-.508-.508c0-.281.228-.508.508-.508v-1c-.832 0-1.508.675-1.508 1.508h1Zm.508-.508c.281 0 .508.227.508.508h1c0-.833-.675-1.508-1.508-1.508v1Zm22.85 6.176V13.872h-1V26.87h1Zm-.5-12.498h3.868v-1h-3.869v1Zm-15.596 6.33H.552v1h13.776v-1Zm-13.276.5V7.392h-1v13.81h1Zm-.5-13.31h13.776v-1H.552v1Zm13.276-.5v13.81h1V7.392h-1Zm22.993 32.99H23.006v1h13.815v-1Zm-13.315.5V27.077h-1v13.805h1Zm-.5-13.305h13.815v-1H23.006v1Zm13.315-.5v13.805h1V27.077h-1ZM22.8 33.628H7.574v1H22.8v-1Zm-14.726.5V21.264h-1v12.864h1ZM40.538 7.472l6.557 6.552.706-.707-6.556-6.552-.707.707Zm6.557 5.845-6.557 6.547.707.707 6.556-6.547-.706-.707Z"
        />
        <path fill="#02acc5" stroke="#02acc5" strokeLinecap="round" strokeLinejoin="round" d="M36.5 15.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
        d="M25.008 36.576a1.008 1.008 0 1 0 0-2.016 1.008 1.008 0 0 0 0 2.016Z"
      />
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        d="M21.12 11.5h21.6m-21.6 12h21.6m-21.6 12h21.6m-28.8-19.66H5.28V7.2h8.64v8.64Zm0 12.48H5.28v-8.64h8.64v8.64Zm0 12.48H5.28v-8.64h8.64v8.64Z"
      />
      <path
        fill="#02acc5"
        stroke="#02acc5"
        strokeMiterlimit="10"
        strokeWidth="3"
        d="M38.928 12.576a1.008 1.008 0 1 0 0-2.016 1.008 1.008 0 0 0 0 2.016Z"
      />
    </svg>
  );
}

export function HarizeonBrandWordmark({
  className,
  variant = "white",
}: {
  className?: string;
  variant?: "white" | "dark" | "auto";
}) {
  if (variant === "auto") {
    return (
      <span className={`inline-flex items-center select-none ${className ?? ""}`}>
        <img
          src="/brand/logo-dark.png"
          alt="Harizeon"
          className="h-8 lg:h-9 w-auto object-contain dark:hidden"
        />
        <img
          src="/brand/logo-white.png"
          alt="Harizeon"
          className="h-8 lg:h-9 w-auto object-contain hidden dark:block"
        />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center select-none ${className ?? ""}`}>
      <img
        src={variant === "dark" ? "/brand/logo-dark.png" : "/brand/logo-white.png"}
        alt="Harizeon"
        className="h-8 lg:h-9 w-auto object-contain"
      />
    </span>
  );
}

export function ShieldOutlineIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M12 2.5 4.5 5.5v6c0 5 3.2 8.7 7.5 10 4.3-1.3 7.5-5 7.5-10v-6L12 2.5Z"
      />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function StatusPulseIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M7.5 12h2.2l1.6-3.5 2.2 7 1.5-3.5h1.5" />
    </svg>
  );
}
