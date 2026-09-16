import { useEffect, useState, useCallback } from 'react';
import { Car, Circle, Sun, type LucideIcon } from 'lucide-react';
import { getState } from '@stevederico/skateboard-ui/Context';
import { useSafeNavigate } from '@stevederico/skateboard-ui/Utilities';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@stevederico/skateboard-ui/shadcn/ui/command';

/**
 * `constants.json` page icon strings mapped to their Lucide component.
 *
 * skateboard-ui 5.0 removed the public dynamic icon resolver, so the icons a
 * page can use are declared here. An unlisted name falls back to `Circle`
 * rather than rendering nothing, keeping the menu rows aligned.
 */
const PAGE_ICONS: Record<string, LucideIcon> = {
  car: Car,
  sun: Sun,
};

/** Page entry from constants.json's pages array. */
interface PageEntry {
  title: string;
  url: string;
  icon: string;
}

/**
 * Global command menu activated via Cmd+K (Mac) or Ctrl+K (Windows).
 *
 * Renders a searchable command palette overlay that lists all app pages
 * from constants.json. Selecting a page navigates to its route under /app/.
 *
 * Uses cmdk under the hood via skateboard-ui's Command primitives.
 * The keyboard listener is global, so this component works regardless
 * of which route is currently active.
 *
 * @component
 * @returns Command dialog with page navigation
 *
 * @example
 * // Add to any layout or view — keyboard shortcut is global
 * <CommandMenu />
 */
export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useSafeNavigate();
  const { state } = getState();
  const pages: PageEntry[] = state.constants?.pages || [];

  useEffect(() => {
    /**
     * Toggle command menu on Cmd+K / Ctrl+K keydown.
     * @param e - Native keyboard event
     */
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Navigate to the selected page and close the menu.
   * @param url - Route path relative to /app/
   */
  const handleSelect = useCallback(
    (url: string) => {
      navigate(`/app/${url}`);
      setOpen(false);
    },
    [navigate]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Menu"
      description="Search and navigate to any page"
    >
      <Command className="rounded-lg">
        <CommandInput placeholder="Search pages..." />
        <CommandList className="p-2">
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => {
              const Icon = PAGE_ICONS[page.icon] ?? Circle;
              return (
                <CommandItem
                  key={page.url}
                  value={page.title}
                  onSelect={() => handleSelect(page.url)}
                  className="gap-3 px-3 py-2.5"
                >
                  <Icon size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                  <span>{page.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
