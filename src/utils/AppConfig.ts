import type { LocalePrefix } from 'node_modules/next-intl/dist/types/src/routing/types';

const localePrefix: LocalePrefix = 'as-needed';

export const AppConfig = {
  name: 'Salomone & Associati',
  locales: [
    {
      id: 'it',
      name: 'Italiano',
    },
    {
      id: 'en',
      name: 'English',
    },
    { id: 'fr', name: 'Français' },
  ],
  defaultLocale: 'it',
  localePrefix,
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);
