export const languages = {
  en: "🇬🇧",
  "pt-BR": "🇧🇷",
};

export const defaultLang = "en";

export const ui: { [key: string]: any } = {
  en: {
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.about": "About",
    "nav.home": "Home",
    "posts.description": "All the articles I've posted.",
  },
  "pt-BR": {
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.about": "Sobre",
    "nav.home": "Página Inicial",
    "posts.description": "Todos os posts publicados.",
  },
} as const;
