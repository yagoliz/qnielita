import { flagUrl } from "@/lib/flags";

/**
 * Small country flag for a team `code`. Renders a flagcdn image for real
 * teams and a neutral grey placeholder for knockout placeholders or unknown
 * codes (e.g. "1A", "W74", or a not-yet-assigned slot). Flags are 4:3 to
 * match flagcdn's aspect ratio.
 */
export function TeamFlag({ code }: { code: string | null | undefined }) {
  const url = flagUrl(code);
  const base = "inline-block h-[15px] w-5 shrink-0 rounded-[2px]";

  if (!url) {
    return (
      <span
        className={`${base} border border-gray-200 bg-gray-100`}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static flag, Next image optimizer is unnecessary overhead
    <img
      src={url}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      className={`${base} border border-gray-200 object-cover`}
    />
  );
}
