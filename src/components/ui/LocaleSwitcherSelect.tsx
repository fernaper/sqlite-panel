import type { ChangeEvent, ReactNode } from 'react';
import { useTransition } from 'react';

import Select from '@/components/ui/Select';

type Props = {
  className?: string;
  labelClassName?: string;
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LocaleSwitcherSelect({
  className,
  labelClassName,
  children,
  defaultValue,
  label
}: Props) {
  const [isPending, startTransition] = useTransition();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value; // Removed Locale type cast
    startTransition(() => {
      // TODO: Implement locale change logic for Astro.
      // This might involve redirecting the user, using client-side routing,
      // or interacting with an Astro i18n integration state.
      console.log('Locale changed to:', nextLocale);
      // Example: window.location.pathname = `/${nextLocale}${/* rest of path */}`;

      // router.replace( // Removed Next.js router logic
      //   // @ts-expect-error -- TypeScript will validate that only known `params`
      //   // are used in combination with a given `pathname`. Since the two will
      //   // always match for the current route, we can skip runtime checks.
      //   {pathname, params},
      //   {locale: nextLocale}
      // );
    });
  }

  return (
    <Select
      label={label}
      className={className}
      labelClassName={labelClassName}
      defaultValue={defaultValue}
      disabled={isPending}
      onChange={onSelectChange}
    >
      {children}
    </Select>
  )
}