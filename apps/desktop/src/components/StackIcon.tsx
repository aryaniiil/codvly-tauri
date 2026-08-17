interface StackIconProps {
  slug: string;
  size?: number;
  title?: string;
}

/** Logo fetched from the free simple-icons CDN. Hardcoded slugs for now. */
export function StackIcon({ slug, size = 12, title }: StackIconProps) {
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}/e6e6ec`}
      width={size}
      height={size}
      alt={title ?? slug}
      title={title}
      loading="lazy"
    />
  );
}