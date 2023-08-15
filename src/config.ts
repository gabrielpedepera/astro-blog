import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://gabrielpereira.dev/",
  author: "Gabriel Pereira",
  desc: "Personal blog to share ideas, thoughts, and content mainly but not exclusively related to software development.",
  title: "Gabriel Pereira",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["en", "pt-BR"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Mail",
    href: "mailto:me@gabrielpereira.dev",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Github",
    href: "https://github.com/gabrielpedepera",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "GitLab",
    href: "https://gitlab.com/gabrielpedepera",
    linkTitle: `${SITE.title} on GitLab`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/gabrielpedepera",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Xing",
    href: "https://www.xing.com/profile/Gabriel_Pereira18/cv",
    linkTitle: `${SITE.title} on Xing`,
    active: true,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/gabrielpedepera",
    linkTitle: `${SITE.title} on Twitter`,
    active: true,
  },
  {
    name: "Mastodon",
    href: "https://hachyderm.io/@gabrielpedepera",
    linkTitle: `${SITE.title} on Mastodon`,
    active: true,
  },
  {
    name: "Twitch",
    href: "https://www.twitch.tv/gabrielpedepera",
    linkTitle: `${SITE.title} on Twitch`,
    active: false,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/channel/UCuRL7vJMw0Kq0ZS2T0ML_Pg",
    linkTitle: `${SITE.title} on YouTube`,
    active: false,
  },
  {
    name: "CodePen",
    href: "https://codepen.io/gabrielpedepera",
    linkTitle: `${SITE.title} on CodePen`,
    active: false,
  },
  {
    name: "Discord",
    href: "https://discordapp.com/users/gabrielpedepera",
    linkTitle: `${SITE.title} on Discord`,
    active: false,
  },
  {
    name: "Reddit",
    href: "https://www.reddit.com/user/gabrielpedepera",
    linkTitle: `${SITE.title} on Reddit`,
    active: false,
  },
  {
    name: "BlueSky",
    href: "https://bsky.app/profile/gabrielpedepera.bsky.social",
    linkTitle: `${SITE.title} on Blue Sky`,
    active: true,
  },
];
