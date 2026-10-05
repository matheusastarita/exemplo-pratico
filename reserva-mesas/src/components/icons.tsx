import type { SVGProps } from "react";

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

function Base({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MailIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Base>
);

export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Base>
);

export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </Base>
);

export const EyeOffIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 3.5 20.5 20.5" />
    <path d="M6.4 6.55C4 8.2 2.5 12 2.5 12S6 18.5 12 18.5c1.76 0 3.28-.55 4.53-1.28M9.9 5.72A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-2.62 3.53" />
    <path d="M9.6 9.6a2.75 2.75 0 0 0 3.88 3.88" />
  </Base>
);

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </Base>
);

export const CalendarPlusIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18M12 13.5v5M9.5 16h5" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
  </Base>
);

/** Grupo de pessoas (nº de pessoas da reserva). */
export const PeopleIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c0-3.2 2.6-5 5.5-5s5.5 1.8 5.5 5" />
    <path d="M16 4.5c1.7.3 3 1.7 3 3.5s-1.3 3.2-3 3.5M20.5 19c0-2.6-1.7-4.2-4-4.8" />
  </Base>
);

/** Mesa vista de lado (tampo + pés). */
export const TableIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 9h18M5 9l-1 10M19 9l1 10M8 9v6h8V9" />
  </Base>
);

/** Garfo e faca. */
export const CutleryIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
    <path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 6.5V13h3.5" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Base>
);

export const AlertIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.2v.3" />
  </Base>
);

/** Planta do salão. */
export const MapIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="6.5" y="6.5" width="4" height="4" rx="1" />
    <circle cx="16" cy="8.5" r="2" />
    <rect x="6.5" y="14" width="11" height="3.5" rx="1" />
  </Base>
);

/** Fila de espera. */
export const QueueIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="7" r="2.2" />
    <circle cx="12" cy="7" r="2.2" />
    <circle cx="18" cy="7" r="2.2" />
    <path d="M3 15c0-2 1.4-3.2 3-3.2S9 13 9 15M9 15c0-2 1.4-3.2 3-3.2s3 1.2 3 3.2M15 15c0-2 1.4-3.2 3-3.2S21 13 21 15M3 19h18" />
  </Base>
);

/** Linha do tempo (lista de horários). */
export const TimelineIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 4v16" />
    <circle cx="6" cy="7" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="6" cy="17" r="1.6" fill="currentColor" stroke="none" />
    <path d="M10 7h10M10 12h7M10 17h9" />
  </Base>
);

export const WalkInIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="13" cy="4.5" r="2" />
    <path d="m9 21 2.5-6 2.5 2v4M8 11l3-3.5h3l2.5 3.5 2.5 1M11 8l-1.5 5.5 4.5 2.5" />
  </Base>
);

export const GiftIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="2" />
    <path d="M3.5 13h17M12 9v11.5M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9Zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9Z" />
  </Base>
);

export const StarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  </Base>
);

export const HeartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  </Base>
);

export const BriefcaseIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18" />
  </Base>
);

export const MoneyIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.4 5 4.1 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.4-2.6-1.2M12 6.5V8M12 16v1.5" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const MinusIcon = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const ChevronIcon = ({
  direction,
  ...p
}: IconProps & { direction: "left" | "right" | "down" | "up" }) => (
  <Base strokeWidth={2} {...p}>
    <path
      d={
        {
          left: "M15 6l-6 6 6 6",
          right: "M9 6l6 6-6 6",
          down: "M6 9l6 6 6-6",
          up: "M6 15l6-6 6 6",
        }[direction]
      }
    />
  </Base>
);

export const MoreIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const CheckCircleIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8 12.3 2.8 2.7L16 9.5" />
  </Base>
);

export const XCircleIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Base>
);

export const UndoIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M5 11.5h9a5 5 0 0 1 0 10h-2" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
  </Base>
);

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 18.5V6.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H8l-4 3.5v-2Z" />
    <path d="M8 9h8M8 12.5h5" />
  </Base>
);

export const PinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Base>
);

export const InstagramIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M6 11.5H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5h-1" />
  </Base>
);

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Base>
);

export const FilterIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Base>
);

export const EditIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15.5 5.5 18.5 8.5M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20Z" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
  </Base>
);

export const BanIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6l12 12" />
  </Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Base>
);

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 8l4 4-4 4M19 12H9" />
  </Base>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Base strokeWidth={2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Base strokeWidth={2} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const TrendIcon = ({ direction, ...p }: IconProps & { direction: "up" | "down" }) => (
  <Base strokeWidth={2} {...p}>
    <path d={direction === "up" ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.6l1.7-2.1M20 20v-4.5h-4.5" />
  </Base>
);

export const ReceiptIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Base>
);

export const SparkleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.2 10.2 12.6 4.5 10.8 10.2 9 12 3.5Z" />
  </Base>
);

export const ChartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Base>
);

export const GridIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Base>
);

export const WhatsAppIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20l1.2-3.8A8 8 0 1 1 8 19l-4 1Z" />
    <path d="M9.2 8.5c.2-.4.5-.5.8-.5h.5l.9 2.1-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 2.1.9v.5c0 .3-.1.6-.5.8-.5.3-1.3.4-2.2 0a8.1 8.1 0 0 1-4.1-4.1c-.4-.9-.3-1.7 0-2.2Z" />
  </Base>
);
