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
    "nav.go_back": "Go back",
    "posts.page": "Page",
    "posts.previous": "Prev",
    "posts.next": "Next",
    "posts.description": "All the articles I've posted.",
    "footer.all_rights_reserved": "All rights reserved.",
  },
  "pt-BR": {
    "nav.posts": "Posts",
    "nav.tags": "Tags",
    "nav.about": "Sobre",
    "nav.home": "Página Inicial",
    "nav.go_back": "Voltar",
    "posts.page": "Página",
    "posts.previous": "Anterior",
    "posts.next": "Próximo",
    "posts.description": "Todos os posts publicados.",
    "footer.all_rights_reserved": "Todos os direitos reservados.",
  },
} as const;
